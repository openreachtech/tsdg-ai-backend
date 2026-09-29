import {
  Op,
} from 'sequelize'

import AiRunPageResponseBuilder from '../../../../app/aiRun/AiRunPageResponseBuilder.js'

import AiRunPageCursor from '../../../../app/aiRun/AiRunPageCursor.js'

import AiModelCall from '../../../../sequelize/models/AiModelCall.js'
import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunCategory from '../../../../sequelize/models/AiRunCategory.js'
import AiRunStatus from '../../../../sequelize/models/AiRunStatus.js'
import AiRunStep from '../../../../sequelize/models/AiRunStep.js'

/*
 * The page of section 13, read end to end against the development seeders.
 *
 * **Nothing is written and nothing about the reads is mocked.** The runs are `#run-contract`'s
 * seeded rows, the steps are `#run-record`'s and the model calls are `#provider-layer`'s, so
 * every page asserted below is one this application really assembled out of four tables. A page
 * built from stubbed rows would prove that the assembly runs and nothing about whether the reads
 * find the right rows — which is the whole of what a list is.
 *
 * **`now` is always passed in, and never read from a clock.** Two of the eleven fields a row
 * carries depend on the instant the request was stamped with: the elapsed time of a run that has
 * not ended, and which runs count as stalled. Reading the real clock would make both untestable,
 * and `2026-09-14T04:00:00.000Z` is the instant every case below is written against — four days
 * after the runs of `#run-contract` and hours after the four this feature added.
 *
 * **The client is a number, because that is all this class is ever given.** The scope is resolved
 * from a verified signature by `AppRestfulApiContext`, and what reaches here is the id it
 * resolved to. The resolution has its own test file.
 */

describe('AiRunPageResponseBuilder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunPageCursorFactory', () => {
        const cases = [
          {
            input: {
              aiRunPageCursorFactory: AiRunPageCursor,
            },
          },
          {
            input: {
              aiRunPageCursorFactory: class DerivedAiRunPageCursor extends AiRunPageCursor {},
            },
          },
        ]

        test.each(cases)('aiRunPageCursorFactory: $input.aiRunPageCursorFactory.name', ({
          input,
        }) => {
          const builder = new AiRunPageResponseBuilder(input)

          expect(builder)
            .toHaveProperty('aiRunPageCursorFactory', input.aiRunPageCursorFactory)
        })
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunPageCursorFactory: AiRunPageCursor,
          },
        },
        {
          input: {
            aiRunPageCursorFactory: class DerivedAiRunPageCursor extends AiRunPageCursor {},
          },
        },
      ]

      test.each(cases)('aiRunPageCursorFactory: $input.aiRunPageCursorFactory.name', ({
        input,
      }) => {
        const received = AiRunPageResponseBuilder.create(input)

        expect(received)
          .toBeInstanceOf(AiRunPageResponseBuilder)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunPageCursorFactory: AiRunPageCursor,
          },
        },
        {
          input: {
            aiRunPageCursorFactory: class DerivedAiRunPageCursor extends AiRunPageCursor {},
          },
        },
      ]

      test.each(cases)('aiRunPageCursorFactory: $input.aiRunPageCursorFactory.name', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunPageResponseBuilder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.create()', () => {
    describe('should fill default aiRunPageCursorFactory', () => {
      test('with no arguments', () => {
        const expected = {
          aiRunPageCursorFactory: AiRunPageCursor,
        }

        const SpyClass = constructorSpy.spyOn(AiRunPageResponseBuilder)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be the run model', () => {
        const received = AiRunPageResponseBuilder.AiRunCtor

        expect(received)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.get:AiRunStatusCtor', () => {
    describe('when called as is', () => {
      test('should be the run status master model', () => {
        const received = AiRunPageResponseBuilder.AiRunStatusCtor

        expect(received)
          .toBe(AiRunStatus) // same reference
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.get:AiRunCategoryCtor', () => {
    describe('when called as is', () => {
      test('should be the run category master model', () => {
        const received = AiRunPageResponseBuilder.AiRunCategoryCtor

        expect(received)
          .toBe(AiRunCategory) // same reference
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.get:AiRunStepCtor', () => {
    describe('when called as is', () => {
      test('should be the step model', () => {
        const received = AiRunPageResponseBuilder.AiRunStepCtor

        expect(received)
          .toBe(AiRunStep) // same reference
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.get:AiModelCallCtor', () => {
    describe('when called as is', () => {
      test('should be the model call model', () => {
        const received = AiRunPageResponseBuilder.AiModelCallCtor

        expect(received)
          .toBe(AiModelCall) // same reference
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.extractAiRunStatusId()', () => {
    describe('with names this service has', () => {
      const cases = [
        {
          input: {
            statusName: 'queued',
          },
          expected: 1,
        },
        {
          input: {
            statusName: 'running',
          },
          expected: 2,
        },
        {
          input: {
            statusName: 'succeeded',
          },
          expected: 3,
        },
        {
          input: {
            statusName: 'failed',
          },
          expected: 4,
        },
        {
          input: {
            statusName: 'canceled',
          },
          expected: 5,
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
        expected,
      }) => {
        const received = AiRunPageResponseBuilder.extractAiRunStatusId(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with names it does not', () => {
      const cases = [
        {
          input: {
            statusName: 'runing',
          },
        },
        {
          input: {
            statusName: 'QUEUED',
          },
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
      }) => {
        const received = AiRunPageResponseBuilder.extractAiRunStatusId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.extractAiRunCategoryId()', () => {
    describe('with names this service has', () => {
      const cases = [
        {
          input: {
            runCategoryName: 'asset-media-extraction',
          },
          expected: 1,
        },
      ]

      test.each(cases)('runCategoryName: $input.runCategoryName', ({
        input,
        expected,
      }) => {
        const received = AiRunPageResponseBuilder.extractAiRunCategoryId(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with names it does not', () => {
      const cases = [
        {
          input: {
            runCategoryName: 'asset-media-extractions',
          },
        },
        {
          input: {
            runCategoryName: 'Asset media extraction',
          },
        },
      ]

      test.each(cases)('runCategoryName: $input.runCategoryName', ({
        input,
      }) => {
        const received = AiRunPageResponseBuilder.extractAiRunCategoryId(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('.isSameAiRunId()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            first: 10010001,
            second: 10010001,
          },
        },
        {
          // MariaDB answers a BIGINT as a string and SQLite as a number, so a page assembled on
          // one dialect must group the same way it does on the other
          input: {
            first: '10010002',
            second: 10010002,
          },
        },
        {
          input: {
            first: '10700003',
            second: '10700003',
          },
        },
      ]

      test.each(cases)('first: $input.first', ({
        input,
      }) => {
        const received = AiRunPageResponseBuilder.isSameAiRunId(input)

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            first: 10010001,
            second: 10010002,
          },
        },
        {
          input: {
            first: '10010004',
            second: 10700004,
          },
        },
      ]

      test.each(cases)('first: $input.first', ({
        input,
      }) => {
        const received = AiRunPageResponseBuilder.isSameAiRunId(input)

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class the instance was built from', () => {
      const cases = [
        {
          input: {
            Ctor: AiRunPageResponseBuilder,
          },
          expected: 'AiRunPageResponseBuilder',
        },
        {
          input: {
            Ctor: class DerivedAiRunPageResponseBuilder extends AiRunPageResponseBuilder {},
          },
          expected: 'DerivedAiRunPageResponseBuilder',
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
        expected,
      }) => {
        const builder = input.Ctor.create()

        const BuilderCtor = builder.Ctor
        const received = BuilderCtor.name

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#extractRunCount()', () => {
    describe('should answer the size the caller asked for', () => {
      const cases = [
        {
          input: {
            limit: 1,
          },
          expected: 1,
        },
        {
          input: {
            limit: 50,
          },
          expected: 50,
        },
        {
          input: {
            limit: 100,
          },
          expected: 100,
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.extractRunCount(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer the default when the caller asked for none', () => {
      const cases = [
        {
          input: {
            limit: null,
          },
          expected: 20,
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.extractRunCount(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunStatusCondition()', () => {
    describe('should answer the condition a status filter puts on the read', () => {
      const cases = [
        {
          input: {
            statusName: 'queued',
          },
          expected: {
            AiRunStatusId: 1,
          },
        },
        {
          input: {
            statusName: 'canceled',
          },
          expected: {
            AiRunStatusId: 5,
          },
        },
        {
          input: {
            statusName: null,
          },
          expected: {},
        },
      ]

      test.each(cases)('statusName: $input.statusName', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildAiRunStatusCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunCategoryCondition()', () => {
    describe('should answer the condition a category filter puts on the read', () => {
      const cases = [
        {
          input: {
            runCategoryName: 'asset-media-extraction',
          },
          expected: {
            AiRunCategoryId: 1,
          },
        },
        {
          input: {
            runCategoryName: null,
          },
          expected: {},
        },
      ]

      test.each(cases)('runCategoryName: $input.runCategoryName', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildAiRunCategoryCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildCorrelationIdCondition()', () => {
    describe('should answer the condition a correlation filter puts on the read', () => {
      const cases = [
        {
          input: {
            correlationId: 'correlation-id-10700000',
          },
          expected: {
            correlationId: 'correlation-id-10700000',
          },
        },
        {
          input: {
            correlationId: 'correlation-id-10010004',
          },
          expected: {
            correlationId: 'correlation-id-10010004',
          },
        },
        {
          input: {
            correlationId: null,
          },
          expected: {},
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildCorrelationIdCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#generateStalledSince()', () => {
    describe('should answer the instant a stalled run must have been waiting since', () => {
      const cases = [
        {
          input: {
            stalledForSeconds: 300,
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: new Date('2026-09-14T03:55:00.000Z'),
        },
        {
          input: {
            stalledForSeconds: 3600,
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: new Date('2026-09-14T03:00:00.000Z'),
        },
        {
          input: {
            stalledForSeconds: 1,
            now: new Date('2026-09-14T04:00:00.500Z'),
          },
          expected: new Date('2026-09-14T03:59:59.500Z'),
        },
        {
          input: {
            stalledForSeconds: 31536000, // the ceiling, which is 365 days
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: new Date('2025-09-14T04:00:00.000Z'),
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateStalledSince(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildStalledCondition()', () => {
    describe('should answer the two branches a stall threshold puts on the read', () => {
      const cases = [
        {
          input: {
            stalledForSeconds: 3600,
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: {
            [Op.or]: [
              {
                AiRunStatusId: 1,
                acceptedAt: {
                  [Op.lte]: new Date('2026-09-14T03:00:00.000Z'),
                },
              },
              {
                AiRunStatusId: 2,
                startedAt: {
                  [Op.lte]: new Date('2026-09-14T03:00:00.000Z'),
                },
              },
            ],
          },
        },
        {
          input: {
            stalledForSeconds: 300,
            now: new Date('2026-09-14T01:00:00.000Z'),
          },
          expected: {
            [Op.or]: [
              {
                AiRunStatusId: 1,
                acceptedAt: {
                  [Op.lte]: new Date('2026-09-14T00:55:00.000Z'),
                },
              },
              {
                AiRunStatusId: 2,
                startedAt: {
                  [Op.lte]: new Date('2026-09-14T00:55:00.000Z'),
                },
              },
            ],
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildStalledCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer nothing when no threshold was asked for', () => {
      const cases = [
        {
          input: {
            stalledForSeconds: null,
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: {},
        },
        {
          input: {
            stalledForSeconds: null,
            now: new Date('2026-09-10T01:00:00.000Z'),
          },
          expected: {},
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildStalledCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildWhereClause()', () => {
    describe('should put the client first and every stated filter after it', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: 'running',
              runCategoryName: 'asset-media-extraction',
              correlationId: 'correlation-id-10700000',
              stalledForSeconds: 3600,
              limit: null,
              cursor: null,
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
            cursorCondition: {
              id: {
                [Op.lt]: 10700003,
              },
            },
          },
          expected: {
            ApiClientId: 10000001,
            AiRunStatusId: 2,
            AiRunCategoryId: 1,
            correlationId: 'correlation-id-10700000',
            [Op.or]: [
              {
                AiRunStatusId: 1,
                acceptedAt: {
                  [Op.lte]: new Date('2026-09-14T03:00:00.000Z'),
                },
              },
              {
                AiRunStatusId: 2,
                startedAt: {
                  [Op.lte]: new Date('2026-09-14T03:00:00.000Z'),
                },
              },
            ],
            id: {
              [Op.lt]: 10700003,
            },
          },
        },
        {
          input: {
            apiClientId: 10000002,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: null,
              cursor: null,
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
            cursorCondition: {},
          },
          expected: {
            ApiClientId: 10000002,
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildWhereClause(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#findCursorAiRun()', () => {
    describe('when the client owns the run the cursor names', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
            apiClientId: 10000001,
          },
          expected: {
            id: 10010001,
          },
        },
        {
          input: {
            runKey: 'run-key-10700001',
            apiClientId: 10000001,
          },
          expected: {
            id: 10700001,
          },
        },
        {
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000002,
          },
          expected: {
            id: 10010003,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const aiRun = await builder.findCursorAiRun(input)
        const received = aiRun.id

        expect(received)
          .toBe(expected.id)
      })
    })

    describe('when it does not', () => {
      const cases = [
        {
          // another client's run key, which is the cursor a caller pasted from somewhere else
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: 'run-key-10700004',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: 'run-key-99999999',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: null,
            apiClientId: 10000001,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findCursorAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildCursorCondition()', () => {
    describe('when the cursor names a run of this client', () => {
      const cases = [
        {
          input: {
            cursor: 'cnVuLWtleS0xMDcwMDAwMQ', // run-key-10700001
            apiClientId: 10000001,
          },
          expected: {
            id: {
              [Op.lt]: 10700001,
            },
          },
        },
        {
          input: {
            cursor: 'cnVuLWtleS0xMDAxMDAwNA', // run-key-10010004
            apiClientId: 10000001,
          },
          expected: {
            id: {
              [Op.lt]: 10010004,
            },
          },
        },
      ]

      test.each(cases)('cursor: $input.cursor', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildCursorCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when no cursor was sent', () => {
      const cases = [
        {
          input: {
            cursor: null,
            apiClientId: 10000001,
          },
          expected: {},
        },
        {
          input: {
            cursor: null,
            apiClientId: 10000002,
          },
          expected: {},
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildCursorCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the cursor names no run of this client', () => {
      const cases = [
        {
          // a run of somebody else, which answers exactly as a fabricated cursor does
          input: {
            cursor: 'cnVuLWtleS0xMDAxMDAwMw', // run-key-10010003
            apiClientId: 10000001,
          },
        },
        {
          input: {
            cursor: 'cnVuLWtleS05OTk5OTk5OQ', // run-key-99999999
            apiClientId: 10000001,
          },
        },
      ]

      test.each(cases)('cursor: $input.cursor', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildCursorCondition(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#findAiRuns()', () => {
    describe('should read the newest runs first, and one more than the page holds', () => {
      const cases = [
        {
          input: {
            whereClause: {
              ApiClientId: 10000001,
            },
            runCount: 2,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
          ],
        },
        {
          input: {
            whereClause: {
              ApiClientId: 10000002,
            },
            runCount: 1,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
          ],
        },
      ]

      test.each(cases)('runCount: $input.runCount', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findAiRuns(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should carry the two master names a row is built from', () => {
      const cases = [
        {
          input: {
            whereClause: {
              runKey: 'run-key-10010004',
            },
            runCount: 1,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010004',
              subjectLabel: 'Subject label of run 10010004',
              acceptedAt: new Date('2026-09-10T04:04:04.004Z'),
              finishedAt: new Date('2026-09-10T04:04:06.006Z'),
              AiRunStatus: expect.objectContaining({
                name: 'succeeded',
              }),
              AiRunCategory: expect.objectContaining({
                name: 'asset-media-extraction',
              }),
            }),
          ],
        },
        {
          input: {
            whereClause: {
              runKey: 'run-key-10010006',
            },
            runCount: 1,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010006',
              subjectLabel: 'Subject label of run 10010006',
              acceptedAt: new Date('2026-09-10T06:06:06.006Z'),
              finishedAt: new Date('2026-09-10T06:06:08.008Z'),
              AiRunStatus: expect.objectContaining({
                name: 'canceled',
              }),
              AiRunCategory: expect.objectContaining({
                name: 'asset-media-extraction',
              }),
            }),
          ],
        },
      ]

      test.each(cases)('runKey: $input.whereClause.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findAiRuns(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#findCompletedAiRunSteps()', () => {
    describe('should read only the steps that finished', () => {
      const cases = [
        {
          // run 10010001 has three steps and its third has not finished, so two come back
          input: {
            aiRunIds: [
              10010001,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
          ]),
        },
        {
          input: {
            aiRunIds: [
              10010005,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
          ]),
        },
        {
          input: {
            aiRunIds: [
              10010004,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 7,
              stepName: 'await-owner-decision',
            }),
          ]),
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findCompletedAiRunSteps(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read no step beyond the ones that finished', () => {
      const cases = [
        {
          // three steps, and the third has not finished
          input: {
            aiRunIds: [
              10010001,
            ],
          },
          expected: 2,
        },
        {
          input: {
            aiRunIds: [
              10010004,
            ],
          },
          expected: 7,
        },
        {
          input: {
            aiRunIds: [
              10010005,
              10010001,
            ],
          },
          expected: 4,
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findCompletedAiRunSteps(input)

        expect(received)
          .toHaveLength(expected)
      })
    })

    describe('should read nothing when asked about no run', () => {
      const cases = [
        {
          input: {
            aiRunIds: [],
          },
        },
        {
          input: {
            aiRunIds: [
              10010002,
            ],
          },
        },
      ]

      test.each(cases)('aiRunIds.length: $input.aiRunIds.length', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findCompletedAiRunSteps(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#findAiModelCalls()', () => {
    describe('should read every call the runs made', () => {
      const cases = [
        {
          input: {
            aiRunIds: [
              10010004,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              inputTokenCount: 4801,
              outputTokenCount: 311,
            }),
            expect.objectContaining({
              inputTokenCount: 4802,
              outputTokenCount: 322,
            }),
            expect.objectContaining({
              inputTokenCount: 4803,
              outputTokenCount: 333,
            }),
          ]),
        },
        {
          input: {
            aiRunIds: [
              10010001,
              10010006,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              inputTokenCount: 1609,
              outputTokenCount: 199,
            }),
            expect.objectContaining({
              inputTokenCount: 2706,
              outputTokenCount: 166,
            }),
            expect.objectContaining({
              inputTokenCount: 2707,
              outputTokenCount: 177,
            }),
          ]),
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findAiModelCalls(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read no call beyond the ones those runs made', () => {
      const cases = [
        {
          input: {
            aiRunIds: [
              10010004,
            ],
          },
          expected: 3,
        },
        {
          input: {
            aiRunIds: [
              10010001,
            ],
          },
          expected: 1,
        },
        {
          input: {
            aiRunIds: [
              10010006,
              10010001,
            ],
          },
          expected: 3,
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findAiModelCalls(input)

        expect(received)
          .toHaveLength(expected)
      })
    })

    describe('should read nothing when asked about no run', () => {
      const cases = [
        {
          input: {
            aiRunIds: [],
          },
        },
        {
          input: {
            aiRunIds: [
              10010002,
            ],
          },
        },
      ]

      test.each(cases)('aiRunIds.length: $input.aiRunIds.length', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.findAiModelCalls(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#chooseFurtherAiRunStep()', () => {
    describe('should answer whichever step ran later in its run', () => {
      const cases = [
        {
          input: {
            first: {
              stepIndex: 2,
              stepName: 'fetch-media',
            },
            second: {
              stepIndex: 5,
              stepName: 'settle-by-majority',
            },
          },
          expected: 'settle-by-majority',
        },
        {
          input: {
            first: {
              stepIndex: 7,
              stepName: 'await-owner-decision',
            },
            second: {
              stepIndex: 3,
              stepName: 'read-media',
            },
          },
          expected: 'await-owner-decision',
        },
        {
          input: {
            first: null,
            second: {
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            },
          },
          expected: 'filter-suggestible-fields',
        },
      ]

      test.each(cases)('second.stepIndex: $input.second.stepIndex', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const aiRunStep = builder.chooseFurtherAiRunStep(input)
        const received = aiRunStep.stepName

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#extractLastCompletedAiRunStep()', () => {
    describe('should answer the furthest step that run finished', () => {
      const cases = [
        {
          input: {
            aiRunSteps: [
              {
                AiRunId: 10010001,
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
              },
              {
                AiRunId: 10010001,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
              {
                AiRunId: 10010004,
                stepIndex: 7,
                stepName: 'await-owner-decision',
              },
            ],
            aiRunId: 10010001,
          },
          expected: 'fetch-media',
        },
        {
          input: {
            aiRunSteps: [
              {
                AiRunId: 10010001,
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
              },
              {
                AiRunId: 10010001,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
              {
                AiRunId: 10010004,
                stepIndex: 7,
                stepName: 'await-owner-decision',
              },
            ],
            aiRunId: 10010004,
          },
          expected: 'await-owner-decision',
        },
        {
          // the rows arrive in whatever order the read answered with, and the furthest still wins
          input: {
            aiRunSteps: [
              {
                AiRunId: 10010006,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
              {
                AiRunId: 10010006,
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
              },
            ],
            aiRunId: 10010006,
          },
          expected: 'fetch-media',
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const aiRunStep = builder.extractLastCompletedAiRunStep(input)
        const received = aiRunStep.stepName

        expect(received)
          .toBe(expected)
      })
    })

    describe('should answer nothing when that run finished none', () => {
      const cases = [
        {
          input: {
            aiRunSteps: [
              {
                AiRunId: 10010001,
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
              },
            ],
            aiRunId: 10010002,
          },
        },
        {
          input: {
            aiRunSteps: [],
            aiRunId: 10700003,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.extractLastCompletedAiRunStep(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#extractOwnAiModelCalls()', () => {
    describe('should answer the calls that run made', () => {
      const cases = [
        {
          input: {
            aiModelCalls: [
              {
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
              {
                AiRunId: 10010006,
                inputTokenCount: 2706,
                outputTokenCount: 166,
              },
              {
                AiRunId: 10010006,
                inputTokenCount: 2707,
                outputTokenCount: 177,
              },
            ],
            aiRunId: 10010006,
          },
          expected: [
            {
              AiRunId: 10010006,
              inputTokenCount: 2706,
              outputTokenCount: 166,
            },
            {
              AiRunId: 10010006,
              inputTokenCount: 2707,
              outputTokenCount: 177,
            },
          ],
        },
        {
          input: {
            aiModelCalls: [
              {
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
              {
                AiRunId: 10010006,
                inputTokenCount: 2706,
                outputTokenCount: 166,
              },
            ],
            aiRunId: 10010001,
          },
          expected: [
            {
              AiRunId: 10010001,
              inputTokenCount: 1609,
              outputTokenCount: 199,
            },
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.extractOwnAiModelCalls(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer nothing when that run made none', () => {
      const cases = [
        {
          input: {
            aiModelCalls: [
              {
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
            aiRunId: 10010002,
          },
        },
        {
          input: {
            aiModelCalls: [],
            aiRunId: 10700003,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.extractOwnAiModelCalls(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildLastCompletedStepResponse()', () => {
    describe('should answer two fields of the step and no more', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              AiRunId: 10010001,
              stepIndex: 2,
              stepName: 'fetch-media',
              finishedAt: new Date('2026-09-12T04:04:04.702Z'),
            },
          },
          expected: {
            stepName: 'fetch-media',
            stepIndex: 2,
          },
        },
        {
          input: {
            aiRunStep: {
              AiRunId: 10010004,
              stepIndex: 7,
              stepName: 'await-owner-decision',
              finishedAt: new Date('2026-09-12T01:01:45.715Z'),
            },
          },
          expected: {
            stepName: 'await-owner-decision',
            stepIndex: 7,
          },
        },
      ]

      test.each(cases)('stepIndex: $input.aiRunStep.stepIndex', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildLastCompletedStepResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should answer nothing when no step finished', () => {
      const cases = [
        {
          input: {
            aiRunStep: null,
          },
        },
      ]

      test.each(cases)('aiRunStep: $input.aiRunStep', ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildLastCompletedStepResponse(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#generateElapsedSeconds()', () => {
    describe('when the run has ended', () => {
      const cases = [
        {
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-10T04:04:04.004Z'),
              finishedAt: new Date('2026-09-10T04:04:06.006Z'),
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 2,
        },
        {
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-10T06:06:06.006Z'),
              finishedAt: new Date('2026-09-10T07:06:06.006Z'),
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 3600,
        },
        {
          // a part second is floored rather than rounded, so a run never reports time it has not
          // taken
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-10T01:00:00.000Z'),
              finishedAt: new Date('2026-09-10T01:00:00.999Z'),
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 0,
        },
      ]

      test.each(cases)('finishedAt: $input.aiRun.finishedAt', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateElapsedSeconds(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the run has not ended', () => {
      const cases = [
        {
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
              finishedAt: null,
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 3593,
        },
        {
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              finishedAt: null,
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 7195,
        },
        {
          // a run accepted by one machine and read by another whose clock is behind reports no
          // negative age
          input: {
            aiRun: {
              acceptedAt: new Date('2026-09-14T04:00:00.500Z'),
              finishedAt: null,
            },
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: 0,
        },
      ]

      test.each(cases)('acceptedAt: $input.aiRun.acceptedAt', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateElapsedSeconds(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#generateInputTokenCount()', () => {
    /*
     * What the calls were sent, which is one of the two figures a row carries and not the whole
     * of what a run spent — `#generateOutputTokenCount()` answers the other, and the two are
     * never added together here.
     *
     * Every call below carries both figures although this method reads one. That is what makes
     * the case fail usefully if the wrong column is ever summed: handed calls carrying only the
     * column under test, a method reading the other would answer `NaN`, which says something
     * went wrong; handed both, it answers a number that is somebody else's, which says which.
     *
     * The figures are the seeded ones: run 10010004's three calls, run 10010006's two, and run
     * 10010001's one.
     */
    describe('should answer what the calls were sent', () => {
      const cases = [
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 4801,
                outputTokenCount: 311,
              },
              {
                inputTokenCount: 4802,
                outputTokenCount: 322,
              },
              {
                inputTokenCount: 4803,
                outputTokenCount: 333,
              },
            ],
          },
          expected: 14406,
        },
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 2706,
                outputTokenCount: 166,
              },
              {
                inputTokenCount: 2707,
                outputTokenCount: 177,
              },
            ],
          },
          expected: 5413,
        },
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
          },
          expected: 1609,
        },
        {
          // a run that has called no model was sent no token, which is a fact and not an unknown
          input: {
            aiModelCalls: [],
          },
          expected: 0,
        },
      ]

      test.each(cases)('aiModelCalls[0].inputTokenCount: $input.aiModelCalls.0.inputTokenCount', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateInputTokenCount(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#generateOutputTokenCount()', () => {
    /*
     * The two counts are summed apart and never added together, because providers price them
     * apart. Every case below therefore carries calls whose two figures differ, and differ by
     * call — a method that had summed the wrong column, or that had been handed the sibling's
     * answer, would come back with a figure no case states.
     *
     * The figures are the seeded ones: run 10010004's three calls, run 10010006's two, and run
     * 10010001's one.
     */
    describe('should answer what the calls returned', () => {
      const cases = [
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 4801,
                outputTokenCount: 311,
              },
              {
                inputTokenCount: 4802,
                outputTokenCount: 322,
              },
              {
                inputTokenCount: 4803,
                outputTokenCount: 333,
              },
            ],
          },
          expected: 966,
        },
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 2706,
                outputTokenCount: 166,
              },
              {
                inputTokenCount: 2707,
                outputTokenCount: 177,
              },
            ],
          },
          expected: 343,
        },
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
          },
          expected: 199,
        },
        {
          // a run that has called no model returned no token, which is a fact and not an unknown
          input: {
            aiModelCalls: [],
          },
          expected: 0,
        },
      ]

      test.each(cases)('aiModelCalls[0].outputTokenCount: $input.aiModelCalls.0.outputTokenCount', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateOutputTokenCount(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#generateNextCursor()', () => {
    describe('when a run was read beyond the page', () => {
      const cases = [
        {
          input: {
            aiRuns: [
              {
                runKey: 'run-key-10700003',
              },
              {
                runKey: 'run-key-10700002',
              },
              {
                runKey: 'run-key-10700001',
              },
            ],
            runCount: 2,
          },
          expected: 'cnVuLWtleS0xMDcwMDAwMg', // run-key-10700002
        },
        {
          input: {
            aiRuns: [
              {
                runKey: 'run-key-10010004',
              },
              {
                runKey: 'run-key-10010002',
              },
            ],
            runCount: 1,
          },
          expected: 'cnVuLWtleS0xMDAxMDAwNA', // run-key-10010004
        },
      ]

      test.each(cases)('runCount: $input.runCount', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateNextCursor(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('when the page is the last one', () => {
      const cases = [
        {
          // exactly full, and nothing behind it
          input: {
            aiRuns: [
              {
                runKey: 'run-key-10700003',
              },
              {
                runKey: 'run-key-10700002',
              },
            ],
            runCount: 2,
          },
        },
        {
          input: {
            aiRuns: [
              {
                runKey: 'run-key-10700001',
              },
            ],
            runCount: 20,
          },
        },
        {
          input: {
            aiRuns: [],
            runCount: 20,
          },
        },
      ]

      test.each(cases)('aiRuns.length: $input.aiRuns.length', ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.generateNextCursor(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunRowResponse()', () => {
    /*
     * The third acceptance criterion of section 13, and the one `#operator-cli` reuses: one row
     * carries the subject label, the run kind, the status, the elapsed time and the token spend.
     * The second is here too — a run in progress reports the last step that completed, rather
     * than only that it is running — and so is the fifth, the subject label being whatever the
     * caller supplied and never anything else.
     */
    describe('should carry every fact a list row states', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10010001,
              runKey: 'run-key-10010001',
              subjectLabel: 'Subject label of run 10010001',
              correlationId: 'correlation-id-10010001',
              externalRef: 'external-ref-10010001',
              acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
              finishedAt: null,
              AiRunStatus: {
                name: 'running',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            aiRunSteps: [
              {
                AiRunId: 10010001,
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
              },
              {
                AiRunId: 10010001,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
            ],
            aiModelCalls: [
              {
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
            now: new Date('2026-09-10T01:01:03.001Z'),
          },
          expected: {
            runKey: 'run-key-10010001',
            runCategoryName: 'asset-media-extraction',
            subjectLabel: 'Subject label of run 10010001',
            correlationId: 'correlation-id-10010001',
            externalRef: 'external-ref-10010001',
            statusName: 'running',
            lastCompletedStep: {
              stepName: 'fetch-media',
              stepIndex: 2,
            },
            elapsedSeconds: 2,
            modelCallCount: 1,
            inputTokenCount: 1609,
            outputTokenCount: 199,
            acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
          },
        },
        {
          // a label whose spacing and punctuation carry meaning comes back exactly as it went in
          input: {
            aiRun: {
              id: 10700001,
              runKey: 'run-key-10700001',
              subjectLabel: '  Plot 12/B — "the corner one"  ',
              correlationId: 'correlation-id-10700000',
              externalRef: 'external-ref-10700001',
              acceptedAt: new Date('2026-09-14T01:00:01.001Z'),
              finishedAt: new Date('2026-09-14T01:00:03.003Z'),
              AiRunStatus: {
                name: 'succeeded',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            aiRunSteps: [
              {
                AiRunId: 10700001,
                stepIndex: 6,
                stepName: 'score-confidence',
              },
              {
                AiRunId: 10700001,
                stepIndex: 7,
                stepName: 'await-owner-decision',
              },
              {
                // another run's step, which this row must not pick up
                AiRunId: 10010001,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
            ],
            aiModelCalls: [
              {
                AiRunId: 10700001,
                inputTokenCount: 4801,
                outputTokenCount: 311,
              },
              {
                AiRunId: 10700001,
                inputTokenCount: 4802,
                outputTokenCount: 322,
              },
              {
                AiRunId: 10700001,
                inputTokenCount: 4803,
                outputTokenCount: 333,
              },
              {
                // another run's call, which this row must not spend on either count
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: {
            runKey: 'run-key-10700001',
            runCategoryName: 'asset-media-extraction',
            subjectLabel: '  Plot 12/B — "the corner one"  ',
            correlationId: 'correlation-id-10700000',
            externalRef: 'external-ref-10700001',
            statusName: 'succeeded',
            lastCompletedStep: {
              stepName: 'await-owner-decision',
              stepIndex: 7,
            },
            elapsedSeconds: 2,
            modelCallCount: 3,
            inputTokenCount: 14406,
            outputTokenCount: 966,
            acceptedAt: new Date('2026-09-14T01:00:01.001Z'),
          },
        },
        {
          // queued, so it has finished no step and spent nothing, and says both rather than
          // leaving them out
          input: {
            aiRun: {
              id: 10700003,
              runKey: 'run-key-10700003',
              subjectLabel: 'Subject label of run 10700003',
              correlationId: 'correlation-id-10700000',
              externalRef: 'external-ref-10700003',
              acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
              finishedAt: null,
              AiRunStatus: {
                name: 'queued',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            aiRunSteps: [
              {
                // another run's step, so the page's array is not empty and this row still has none
                AiRunId: 10010001,
                stepIndex: 2,
                stepName: 'fetch-media',
              },
            ],
            aiModelCalls: [
              {
                AiRunId: 10010001,
                inputTokenCount: 1609,
                outputTokenCount: 199,
              },
            ],
            now: new Date('2026-09-14T04:00:00.000Z'),
          },
          expected: {
            runKey: 'run-key-10700003',
            runCategoryName: 'asset-media-extraction',
            subjectLabel: 'Subject label of run 10700003',
            correlationId: 'correlation-id-10700000',
            externalRef: 'external-ref-10700003',
            statusName: 'queued',
            lastCompletedStep: null,
            elapsedSeconds: 3593,
            modelCallCount: 0,
            inputTokenCount: 0,
            outputTokenCount: 0,
            acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = builder.buildAiRunRowResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * The first and the eighth acceptance criteria of section 13, read as one: the list returns
     * only runs belonging to the calling client, whatever the request asks for, and the scope is
     * bound from the signature with no request parameter widening it.
     *
     * The two clients below hold runs the other does not, and run 10700004 belongs to the second
     * while carrying the first's correlation id. A read that had forgotten the client would
     * answer it to both.
     */
    describe('should answer only the calling client its own runs', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 3,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700003',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700003',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700003',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 7193,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
              },
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700002',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700002',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 10795,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              },
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700001',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700001',
                statusName: 'succeeded',
                lastCompletedStep: null,
                elapsedSeconds: 2,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T01:00:01.001Z'),
              },
            ],
            nextCursor: 'cnVuLWtleS0xMDcwMDAwMQ', // run-key-10700001
          },
        },
        {
          input: {
            apiClientId: 10000002,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 2,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700004',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700004',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700004',
                statusName: 'failed',
                lastCompletedStep: null,
                elapsedSeconds: 2,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T04:00:07.007Z'),
              },
              {
                runKey: 'run-key-10010008',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010008',
                correlationId: 'correlation-id-10010008',
                externalRef: 'external-ref-10010008',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 334311,
                modelCallCount: 2,
                inputTokenCount: 3623, // 1811 + 1812
                outputTokenCount: 453, // 221 + 232
                acceptedAt: new Date('2026-09-10T08:08:08.008Z'),
              },
            ],
            nextCursor: 'cnVuLWtleS0xMDAxMDAwOA', // run-key-10010008
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * The second acceptance criterion: a run in progress reports the last step that completed,
     * rather than only that it is running.
     *
     * Run 10010001 is the one the fixtures hold for it — two steps finished and a third open — so
     * what comes back is the second and never the third. Run 10700002 is running and has finished
     * nothing, which is the other state the same criterion covers and a different answer from the
     * first: null says no step has completed, and it is not the same as saying nothing at all.
     */
    describe('should report the furthest step each run finished', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: 'running',
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700002',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700002',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 10795,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              },
              {
                runKey: 'run-key-10010001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010001',
                correlationId: 'correlation-id-10010001',
                externalRef: 'external-ref-10010001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'fetch-media',
                  stepIndex: 2,
                },
                elapsedSeconds: 359938,
                modelCallCount: 1,
                inputTokenCount: 1609,
                outputTokenCount: 199,
                acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
              },
            ],
            nextCursor: null,
          },
        },
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: 'succeeded',
              runCategoryName: 'asset-media-extraction',
              correlationId: 'correlation-id-10010004',
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10010004',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010004',
                correlationId: 'correlation-id-10010004',
                externalRef: 'external-ref-10010004',
                statusName: 'succeeded',
                lastCompletedStep: {
                  stepName: 'await-owner-decision',
                  stepIndex: 7,
                },
                elapsedSeconds: 2,
                modelCallCount: 3,
                inputTokenCount: 14406, // 4801 + 4802 + 4803
                outputTokenCount: 966, // 311 + 322 + 333
                acceptedAt: new Date('2026-09-10T04:04:04.004Z'),
              },
            ],
            nextCursor: null,
          },
        },
      ]

      test.each(cases)('statusName: $input.input.statusName', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * The sixth acceptance criterion: filtering by correlation id returns every run for that
     * object.
     *
     * The three runs of client 10000001 come back together although they are in three different
     * states, which is the point of grouping by the object rather than by the work. The fourth
     * run carrying the same id belongs to another client and is not among them — that is the
     * first criterion holding while the sixth is exercised, and a read that filtered by the
     * correlation id alone would answer four.
     *
     * "whichever service produced it" cannot be read off this fixture set and is not asserted:
     * `ai_run_categories` holds one row this version, so every run of every correlation id is of
     * the same service. The clause becomes readable when a second AI service adds its row.
     */
    describe('should answer every run of one business object', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: 'correlation-id-10700000',
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700003',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700003',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700003',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 7193,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
              },
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700002',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700002',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 10795,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              },
              {
                runKey: 'run-key-10700001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700001',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700001',
                statusName: 'succeeded',
                lastCompletedStep: null,
                elapsedSeconds: 2,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T01:00:01.001Z'),
              },
            ],
            nextCursor: null,
          },
        },
        {
          // the same correlation id asked after by the client that owns one of the four runs
          input: {
            apiClientId: 10000002,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: 'correlation-id-10700000',
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700004',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700004',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700004',
                statusName: 'failed',
                lastCompletedStep: null,
                elapsedSeconds: 2,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T04:00:07.007Z'),
              },
            ],
            nextCursor: null,
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * The fourth acceptance criterion: runs stalled beyond a given number of seconds are
     * retrievable in one request.
     *
     * Two thresholds, and the difference between them is what shows the threshold bites. Run
     * 10700003 was accepted at 03:00:06 and has never been picked up: at two hours it is inside
     * the threshold and does not come back, at one hour it is outside it and does. Every run that
     * has settled is absent from both, however long it took — a finished run did not stall.
     */
    describe('should answer the runs that have been waiting too long', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: 7200,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700002',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700002',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 10795,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              },
              {
                runKey: 'run-key-10010002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010002',
                correlationId: 'correlation-id-10010002',
                externalRef: 'external-ref-10010002',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 356277,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-10T02:02:02.002Z'),
              },
              {
                runKey: 'run-key-10010001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010001',
                correlationId: 'correlation-id-10010001',
                externalRef: 'external-ref-10010001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'fetch-media',
                  stepIndex: 2,
                },
                elapsedSeconds: 359938,
                modelCallCount: 1,
                inputTokenCount: 1609,
                outputTokenCount: 199,
                acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
              },
            ],
            nextCursor: null,
          },
        },
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: 3600,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              {
                runKey: 'run-key-10700003',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700003',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700003',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 7193,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T03:00:06.006Z'),
              },
              {
                runKey: 'run-key-10700002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10700002',
                correlationId: 'correlation-id-10700000',
                externalRef: 'external-ref-10700002',
                statusName: 'running',
                lastCompletedStep: null,
                elapsedSeconds: 10795,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-14T02:00:04.004Z'),
              },
              {
                runKey: 'run-key-10010002',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010002',
                correlationId: 'correlation-id-10010002',
                externalRef: 'external-ref-10010002',
                statusName: 'queued',
                lastCompletedStep: null,
                elapsedSeconds: 356277,
                modelCallCount: 0,
                inputTokenCount: 0,
                outputTokenCount: 0,
                acceptedAt: new Date('2026-09-10T02:02:02.002Z'),
              },
              {
                runKey: 'run-key-10010001',
                runCategoryName: 'asset-media-extraction',
                subjectLabel: 'Subject label of run 10010001',
                correlationId: 'correlation-id-10010001',
                externalRef: 'external-ref-10010001',
                statusName: 'running',
                lastCompletedStep: {
                  stepName: 'fetch-media',
                  stepIndex: 2,
                },
                elapsedSeconds: 359938,
                modelCallCount: 1,
                inputTokenCount: 1609,
                outputTokenCount: 199,
                acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
              },
            ],
            nextCursor: null,
          },
        },
      ]

      test.each(cases)('stalledForSeconds: $input.input.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * The seventh acceptance criterion: the list is paginated, and a page states how to ask for
     * the next one.
     *
     * The three pages below are one walk through the same nine runs, each asked for with the
     * cursor the page before it answered with. No run appears twice and none is skipped, and the
     * last page states null rather than a cursor onto nothing — which is what lets a client walk
     * until it reads null instead of counting rows against the size it asked for.
     */
    describe('should hand a walk from one page to the next', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 4,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              expect.objectContaining({
                runKey: 'run-key-10700003',
              }),
              expect.objectContaining({
                runKey: 'run-key-10700002',
              }),
              expect.objectContaining({
                runKey: 'run-key-10700001',
              }),
              expect.objectContaining({
                runKey: 'run-key-10010011',
              }),
            ],
            nextCursor: 'cnVuLWtleS0xMDAxMDAxMQ', // run-key-10010011
          },
        },
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 4,
              cursor: 'cnVuLWtleS0xMDAxMDAxMQ', // run-key-10010011
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              expect.objectContaining({
                runKey: 'run-key-10010006',
              }),
              expect.objectContaining({
                runKey: 'run-key-10010005',
              }),
              expect.objectContaining({
                runKey: 'run-key-10010004',
              }),
              expect.objectContaining({
                runKey: 'run-key-10010002',
              }),
            ],
            nextCursor: 'cnVuLWtleS0xMDAxMDAwMg', // run-key-10010002
          },
        },
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 4,
              cursor: 'cnVuLWtleS0xMDAxMDAwMg', // run-key-10010002
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [
              expect.objectContaining({
                runKey: 'run-key-10010001',
              }),
            ],
            nextCursor: null,
          },
        },
      ]

      test.each(cases)('cursor: $input.input.cursor', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * A page that came back exactly full with nothing behind it states no cursor. It is the case
     * a size read against the page it came back in cannot tell from a full page with more to
     * come, and the reason the read takes one row beyond the page rather than counting.
     */
    describe('should state no cursor when the page ends the list', () => {
      const cases = [
        {
          // client 10000002 holds four runs, and four is what is asked for
          input: {
            apiClientId: 10000002,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 4,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
        },
        {
          input: {
            apiClientId: 10000003,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 2,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const aiRunsResponse = await builder.buildAiRunsResponse(input)
        const received = aiRunsResponse.nextCursor

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * A filter nothing matches is an empty page and not a refusal, and it still states a cursor
     * of null rather than leaving the field out.
     */
    describe('should answer an empty page when nothing matched', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: 'correlation-id-nothing-carries',
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [],
            nextCursor: null,
          },
        },
        {
          // this client has no run in that state, although the state itself exists
          input: {
            apiClientId: 10000003,
            input: {
              statusName: 'succeeded',
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 20,
              cursor: null,
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
          expected: {
            runs: [],
            nextCursor: null,
          },
        },
      ]

      test.each(cases)('apiClientId: $input.apiClientId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunPageResponseBuilder', () => {
  describe('#buildAiRunsResponse()', () => {
    /*
     * A cursor naming no run of this client answers with nothing at all, and the caller turns
     * that into the one refusal a bad cursor is answered with. A cursor carrying another client's
     * run key is among these, and it answers exactly as a fabricated one does — a page that came
     * back empty instead would have told the caller that run exists.
     */
    describe('should answer nothing when the cursor names no run of this client', () => {
      const cases = [
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 20,
              cursor: 'cnVuLWtleS0xMDAxMDAwMw', // run-key-10010003, which belongs to 10000002
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
        },
        {
          input: {
            apiClientId: 10000001,
            input: {
              statusName: null,
              runCategoryName: null,
              correlationId: null,
              stalledForSeconds: null,
              limit: 20,
              cursor: 'cnVuLWtleS05OTk5OTk5OQ', // run-key-99999999, which names no run at all
            },
            now: new Date('2026-09-14T05:00:00.000Z'),
          },
        },
      ]

      test.each(cases)('cursor: $input.input.cursor', async ({
        input,
      }) => {
        const builder = AiRunPageResponseBuilder.create()

        const received = await builder.buildAiRunsResponse(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})
