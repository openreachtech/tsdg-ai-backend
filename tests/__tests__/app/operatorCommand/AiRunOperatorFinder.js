import {
  Op,
} from 'sequelize'

import AiRunOperatorFinder from '../../../../app/operatorCommand/AiRunOperatorFinder.js'

import AiRunPageResponseBuilder from '../../../../app/aiRun/AiRunPageResponseBuilder.js'

import AiModelCall from '../../../../sequelize/models/AiModelCall.js'
import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunCategory from '../../../../sequelize/models/AiRunCategory.js'
import AiRunStatus from '../../../../sequelize/models/AiRunStatus.js'
import AiRunStep from '../../../../sequelize/models/AiRunStep.js'
import AiRunStepCategory from '../../../../sequelize/models/AiRunStepCategory.js'

/*
 * The four commands of section 16, read end to end against the development seeders.
 *
 * **Nothing is written and nothing about the reads is mocked.** The runs are `#run-contract`'s
 * seeded rows, the steps are `#run-record`'s and the model calls are `#provider-layer`'s, so every
 * answer asserted below is one this application really read out of four tables. A stubbed row
 * would prove that the assembly runs and nothing about whether the query finds the right rows —
 * which is the whole of what a finder is.
 *
 * **Which client each seeded run belongs to, because the second criterion is about exactly that.**
 * The CLI reads across every client, and a query that quietly grew a client filter would still
 * answer plausibly for any one client. So the cases below are chosen to straddle clients, and each
 * one names the clients it straddles:
 *
 *   - client 10000001 owns 10010001, 10010002, 10010004, 10010005, 10010006, 10010011,
 *     10700001, 10700002 and 10700003
 *   - client 10000002 owns 10010003, 10010007, 10010008 and 10700004
 *   - client 10000003 owns 10010009 and 10010010, and is the client that is switched off — the
 *     API answers its runs to nobody, and this command reads them like any other
 *
 * **`now` is always passed in, never read from a clock.** Which runs count as stalled depends on
 * the instant the command was run, and a finder reading the real clock would make every stall case
 * below untestable.
 *
 * **The ids that are invented rather than seeded carry the 109 prefix**, which is this feature's
 * own block — a run key or a correlation id built from any other prefix could collide with a row
 * somebody else seeded, and "nothing found" would then be a false pass.
 */

describe('AiRunOperatorFinder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunPageResponseBuilder', () => {
        const cases = [
          {
            label: 'a stub answering an empty condition',
            input: {
              aiRunPageResponseBuilder: {
                buildStalledCondition: () => ({}),
              },
            },
          },
          {
            label: 'the real page response builder',
            input: {
              aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
            },
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const finder = new AiRunOperatorFinder(input)

          expect(finder)
            .toHaveProperty('aiRunPageResponseBuilder', input.aiRunPageResponseBuilder)
        })
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          label: 'a stub answering an empty condition',
          input: {
            aiRunPageResponseBuilder: {
              buildStalledCondition: () => ({}),
            },
          },
        },
        {
          label: 'the real page response builder',
          input: {
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const received = AiRunOperatorFinder.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorFinder)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          label: 'a stub answering an empty condition',
          input: {
            aiRunPageResponseBuilder: {
              buildStalledCondition: () => ({}),
            },
          },
        },
        {
          label: 'the real page response builder',
          input: {
            aiRunPageResponseBuilder: AiRunPageResponseBuilder.create(),
          },
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorFinder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.create()', () => {
    describe('should fill default aiRunPageResponseBuilder', () => {
      test('with no arguments', () => {
        const expected = {
          aiRunPageResponseBuilder: expect.any(AiRunPageResponseBuilder),
        }

        const SpyClass = constructorSpy.spyOn(AiRunOperatorFinder)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill it through the supplier', () => {
      test('with no arguments', () => {
        const supplierSpy = jest.spyOn(AiRunOperatorFinder, 'createAiRunPageResponseBuilder')

        AiRunOperatorFinder.create()

        expect(supplierSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.createAiRunPageResponseBuilder()', () => {
    test('should create the builder holding the definition of a stalled run', () => {
      const received = AiRunOperatorFinder.createAiRunPageResponseBuilder()

      expect(received)
        .toBeInstanceOf(AiRunPageResponseBuilder)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiRunCtor', () => {
    test('should be the run model', () => {
      const expected = AiRun

      const received = AiRunOperatorFinder.AiRunCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiRunStatusCtor', () => {
    test('should be the run status master model', () => {
      const expected = AiRunStatus

      const received = AiRunOperatorFinder.AiRunStatusCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiRunCategoryCtor', () => {
    test('should be the run category master model', () => {
      const expected = AiRunCategory

      const received = AiRunOperatorFinder.AiRunCategoryCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiRunStepCtor', () => {
    test('should be the step model', () => {
      const expected = AiRunStep

      const received = AiRunOperatorFinder.AiRunStepCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiRunStepCategoryCtor', () => {
    test('should be the step category master model', () => {
      const expected = AiRunStepCategory

      const received = AiRunOperatorFinder.AiRunStepCategoryCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('.get:AiModelCallCtor', () => {
    test('should be the model call model', () => {
      const expected = AiModelCall

      const received = AiRunOperatorFinder.AiModelCallCtor

      expect(received)
        .toBe(expected)
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class the instance was built from', () => {
      const cases = [
        {
          input: {
            FinderCtor: AiRunOperatorFinder,
          },
        },
        {
          input: {
            FinderCtor: class DerivedAiRunOperatorFinder extends AiRunOperatorFinder {},
          },
        },
      ]

      test.each(cases)('FinderCtor: $input.FinderCtor.name', ({
        input,
      }) => {
        const finder = input.FinderCtor.create()

        const received = finder.Ctor

        expect(received)
          .toBe(input.FinderCtor)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findStalledAiRuns()', () => {
    describe('should answer the runs that have been where they are for too long', () => {
      const cases = [
        {
          // every unsettled run of the fixture set, across clients 10000001 and 10000002,
          // newest first
          input: {
            stalledForSeconds: 60,
            now: new Date('2026-09-14T04:00:00.000Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
        {
          // only the runs of 2026-09-10 are old enough by this instant
          input: {
            stalledForSeconds: 3600,
            now: new Date('2026-09-10T12:00:00.000Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer runs of more than one client', () => {
      const cases = [
        {
          // 10010001 belongs to client 10000001 and 10010008 to client 10000002, so an
          // answer carrying both is one no client filter could have produced
          input: {
            stalledForSeconds: 60,
            now: new Date('2026-09-14T04:00:00.000Z'),
            limit: null,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
          ]),
        },
        {
          // the queued runs of the same two clients, under a tighter threshold
          input: {
            stalledForSeconds: 3600,
            now: new Date('2026-09-10T12:00:00.000Z'),
            limit: null,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
          ]),
        },
      ]

      test.each(cases)('stalledForSeconds: $input.stalledForSeconds', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should hold a run exactly at the threshold to be stalled', () => {
      const cases = [
        {
          // run 10010008 started at 08:08:09.009, and this instant is ten seconds past it
          // to the millisecond
          input: {
            stalledForSeconds: 10,
            now: new Date('2026-09-10T08:08:19.009Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
        {
          // one millisecond short of it, and 10010008 is no longer stalled
          input: {
            stalledForSeconds: 10,
            now: new Date('2026-09-10T08:08:19.008Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
        {
          // the queued branch of the same threshold: run 10010002 was accepted at
          // 02:02:02.002, and this instant is five seconds past it to the millisecond
          input: {
            stalledForSeconds: 5,
            now: new Date('2026-09-10T02:02:07.002Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
        {
          // one millisecond short of it, and the queued run drops out while the running
          // one stays
          input: {
            stalledForSeconds: 5,
            now: new Date('2026-09-10T02:02:07.001Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010001',
            }),
          ],
        },
      ]

      test.each(cases)('now: $input.now', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer the steps those runs finished, and no step that only began', () => {
      test('at 2026-09-14T04:00:00.000Z', async () => {
        const input = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
          limit: null,
        }

        // run 10010001 has three steps and its third has not finished, so a list row
        // reads the second as the furthest it got
        const expected = [
          expect.objectContaining({
            stepIndex: 1,
            stepName: 'filter-suggestible-fields',
          }),
          expect.objectContaining({
            stepIndex: 2,
            stepName: 'fetch-media',
          }),
        ]

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRunSteps)
          .toEqual(expected)
      })
    })

    describe('should answer the model calls of runs of more than one client', () => {
      test('at 2026-09-14T04:00:00.000Z', async () => {
        const input = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
          limit: null,
        }

        // one call of run 10010001 (client 10000001) and two of run 10010008 (client 10000002)
        const expected = expect.arrayContaining([
          expect.objectContaining({
            inputTokenCount: 1609,
            outputTokenCount: 199,
          }),
          expect.objectContaining({
            inputTokenCount: 1811,
            outputTokenCount: 221,
          }),
          expect.objectContaining({
            inputTokenCount: 1812,
            outputTokenCount: 232,
          }),
        ])

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiModelCalls)
          .toEqual(expected)
      })

      test('carrying no call of a run it did not find', async () => {
        const input = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
          limit: null,
        }

        const expected = 3

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiModelCalls)
          .toHaveLength(expected)
      })
    })

    describe('should bound the answer to the stated limit', () => {
      const cases = [
        {
          input: {
            stalledForSeconds: 60,
            now: new Date('2026-09-14T04:00:00.000Z'),
            limit: 2,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
          ],
        },
        {
          input: {
            stalledForSeconds: 60,
            now: new Date('2026-09-14T04:00:00.000Z'),
            limit: 4,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010008',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010007',
            }),
          ],
        },
      ]

      test.each(cases)('limit: $input.limit', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer no run when none has been waiting that long', () => {
      const cases = [
        {
          // before any run of the fixture set was accepted
          input: {
            stalledForSeconds: 60,
            now: new Date('2026-09-09T00:00:00.000Z'),
            limit: null,
          },
        },
        {
          // a threshold of a whole year, which no run in the set has reached
          input: {
            stalledForSeconds: 31536000,
            now: new Date('2026-09-14T04:00:00.000Z'),
            limit: null,
          },
        },
      ]

      test.each(cases)('now: $input.now', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findStalledAiRuns(input)

        expect(found.aiRuns)
          .toHaveLength(0)
      })
    })

    describe('should borrow the definition of a stalled run rather than restate it', () => {
      test('at 2026-09-14T04:00:00.000Z', async () => {
        const input = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
          limit: null,
        }

        const expected = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
        }

        const aiRunPageResponseBuilder = AiRunPageResponseBuilder.create()
        const conditionSpy = jest.spyOn(aiRunPageResponseBuilder, 'buildStalledCondition')
        const finder = AiRunOperatorFinder.create({
          aiRunPageResponseBuilder,
        })

        await finder.findStalledAiRuns(input)

        expect(conditionSpy)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should change no run', () => {
      test('at 2026-09-14T04:00:00.000Z', async () => {
        const input = {
          stalledForSeconds: 60,
          now: new Date('2026-09-14T04:00:00.000Z'),
          limit: null,
        }

        const createSpy = jest.spyOn(AiRun, 'create')
        const updateSpy = jest.spyOn(AiRun, 'update')
        const destroySpy = jest.spyOn(AiRun, 'destroy')
        const finder = AiRunOperatorFinder.create()

        await finder.findStalledAiRuns(input)

        expect(createSpy)
          .not
          .toHaveBeenCalled()
        expect(updateSpy)
          .not
          .toHaveBeenCalled()
        expect(destroySpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findFailedAiRuns()', () => {
    describe('should answer the runs that failed since the stated instant', () => {
      const cases = [
        {
          // every failed run of the fixture set, across clients 10000001, 10000002 and
          // 10000003, newest first
          input: {
            failedSince: new Date('2026-09-01T00:00:00.000Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010005',
            }),
          ],
        },
        {
          // past the three that ended on 2026-09-10
          input: {
            failedSince: new Date('2026-09-12T00:00:00.000Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
          ],
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer runs of more than one client', () => {
      const cases = [
        {
          // 10010005 belongs to client 10000001, 10700004 to 10000002 and 10010009 to
          // 10000003 — three clients in one answer
          input: {
            failedSince: new Date('2026-09-01T00:00:00.000Z'),
            limit: null,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              runKey: 'run-key-10010005',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
          ]),
        },
        {
          // the switched-off client's run is still read, beside the active client's
          input: {
            failedSince: new Date('2026-09-10T06:00:00.000Z'),
            limit: null,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
          ]),
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should hold a run that failed exactly at the instant to be in the answer', () => {
      const cases = [
        {
          // run 10010009 finished at 09:09:11.011, and this is that instant to the millisecond
          input: {
            failedSince: new Date('2026-09-10T09:09:11.011Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
          ],
        },
        {
          // one millisecond past it, and 10010009 drops out
          input: {
            failedSince: new Date('2026-09-10T09:09:11.012Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
          ],
        },
        {
          // the earliest failure of the set, at its own instant, so all four are in
          input: {
            failedSince: new Date('2026-09-10T05:05:07.007Z'),
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010005',
            }),
          ],
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer no run that ended in any other state', () => {
      test('since 2026-09-01T00:00:00.000Z', async () => {
        const input = {
          failedSince: new Date('2026-09-01T00:00:00.000Z'),
          limit: null,
        }

        // the succeeded, canceled, queued and running runs of the set are all outside it,
        // so the four failed ones are the whole answer
        const expected = 4

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toHaveLength(expected)
      })
    })

    describe('should answer the steps and the model calls of the runs it found', () => {
      test('the two steps run 10010005 finished', async () => {
        const input = {
          failedSince: new Date('2026-09-01T00:00:00.000Z'),
          limit: null,
        }

        const expected = [
          expect.objectContaining({
            stepIndex: 1,
            stepName: 'filter-suggestible-fields',
          }),
          expect.objectContaining({
            stepIndex: 2,
            stepName: 'fetch-media',
            outcomeCode: 'media-fetch-failed',
            reasonCode: 'media-unreadable',
          }),
        ]

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRunSteps)
          .toEqual(expected)
      })

      test('the one call run 10010009 made', async () => {
        const input = {
          failedSince: new Date('2026-09-01T00:00:00.000Z'),
          limit: null,
        }

        const expected = [
          expect.objectContaining({
            inputTokenCount: 1710,
            outputTokenCount: 210,
          }),
        ]

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiModelCalls)
          .toEqual(expected)
      })
    })

    describe('should bound the answer to the stated limit', () => {
      const cases = [
        {
          input: {
            failedSince: new Date('2026-09-01T00:00:00.000Z'),
            limit: 1,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
          ],
        },
        {
          input: {
            failedSince: new Date('2026-09-01T00:00:00.000Z'),
            limit: 3,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010011',
            }),
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
          ],
        },
      ]

      test.each(cases)('limit: $input.limit', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer no run when none failed since then', () => {
      const cases = [
        {
          input: {
            failedSince: new Date('2027-01-01T00:00:00.000Z'),
            limit: null,
          },
        },
        {
          // one millisecond past the latest failure of the set
          input: {
            failedSince: new Date('2026-09-14T04:00:09.010Z'),
            limit: null,
          },
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findFailedAiRuns(input)

        expect(found.aiRuns)
          .toHaveLength(0)
      })
    })

    describe('should change no run', () => {
      test('since 2026-09-01T00:00:00.000Z', async () => {
        const input = {
          failedSince: new Date('2026-09-01T00:00:00.000Z'),
          limit: null,
        }

        const createSpy = jest.spyOn(AiRun, 'create')
        const updateSpy = jest.spyOn(AiRun, 'update')
        const destroySpy = jest.spyOn(AiRun, 'destroy')
        const finder = AiRunOperatorFinder.create()

        await finder.findFailedAiRuns(input)

        expect(createSpy)
          .not
          .toHaveBeenCalled()
        expect(updateSpy)
          .not
          .toHaveBeenCalled()
        expect(destroySpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiRunsByCorrelationId()', () => {
    describe('should answer every run under one correlation id, earliest first', () => {
      const cases = [
        {
          // the four runs of one business object, across clients 10000001 and 10000002
          input: {
            correlationId: 'correlation-id-10700000',
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
          ],
        },
        {
          input: {
            correlationId: 'correlation-id-10010004',
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010004',
            }),
          ],
        },
        {
          // a run of the switched-off client, under its own id
          input: {
            correlationId: 'correlation-id-10010009',
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10010009',
            }),
          ],
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer runs of more than one client', () => {
      test('for correlation-id-10700000', async () => {
        const input = {
          correlationId: 'correlation-id-10700000',
          limit: null,
        }

        // 10700001 belongs to client 10000001 and 10700004 to client 10000002. The
        // client-facing list answers three runs here and this command answers four,
        // which is the difference the second criterion is about
        const expected = expect.arrayContaining([
          expect.objectContaining({
            runKey: 'run-key-10700001',
          }),
          expect.objectContaining({
            runKey: 'run-key-10700004',
          }),
        ])

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })

      test('carrying the run of the other client and not only the three of the first', async () => {
        const input = {
          correlationId: 'correlation-id-10700000',
          limit: null,
        }

        const expected = 4

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRuns)
          .toHaveLength(expected)
      })
    })

    describe('should answer the steps and the model calls of the runs it found', () => {
      test('the seven steps run 10010004 finished', async () => {
        const input = {
          correlationId: 'correlation-id-10010004',
          limit: null,
        }

        const expected = 7

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRunSteps)
          .toHaveLength(expected)
      })

      test('the three readings run 10010004 spent', async () => {
        const input = {
          correlationId: 'correlation-id-10010004',
          limit: null,
        }

        // the calls are read under no order of their own, so the set is asserted and
        // the count beside it guards against a call of some other run joining it
        const expected = expect.arrayContaining([
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
        ])

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiModelCalls)
          .toEqual(expected)
        expect(found.aiModelCalls)
          .toHaveLength(3)
      })
    })

    describe('should bound the answer to the stated limit', () => {
      const cases = [
        {
          input: {
            correlationId: 'correlation-id-10700000',
            limit: 2,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
          ],
        },
        {
          input: {
            correlationId: 'correlation-id-10700000',
            limit: 3,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
          ],
        },
      ]

      test.each(cases)('limit: $input.limit', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRuns)
          .toEqual(expected)
      })
    })

    describe('should answer no run when no run carries that correlation id', () => {
      const cases = [
        {
          input: {
            correlationId: 'correlation-id-10900001',
            limit: null,
          },
        },
        {
          // a prefix of a seeded id, which must not match it
          input: {
            correlationId: 'correlation-id-1070000',
            limit: null,
          },
        },
      ]

      test.each(cases)('correlationId: $input.correlationId', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunsByCorrelationId(input)

        expect(found.aiRuns)
          .toHaveLength(0)
      })
    })

    describe('should change no run', () => {
      test('for correlation-id-10700000', async () => {
        const input = {
          correlationId: 'correlation-id-10700000',
          limit: null,
        }

        const createSpy = jest.spyOn(AiRun, 'create')
        const updateSpy = jest.spyOn(AiRun, 'update')
        const destroySpy = jest.spyOn(AiRun, 'destroy')
        const finder = AiRunOperatorFinder.create()

        await finder.findAiRunsByCorrelationId(input)

        expect(createSpy)
          .not
          .toHaveBeenCalled()
        expect(updateSpy)
          .not
          .toHaveBeenCalled()
        expect(destroySpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiRunByRunKey()', () => {
    describe('should answer the run the key names', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: expect.objectContaining({
            runKey: 'run-key-10010001',
            correlationId: 'correlation-id-10010001',
            externalRef: 'external-ref-10010001',
            failureReasonCode: null,
            acceptedAt: new Date('2026-09-10T01:01:01.001Z'),
            startedAt: new Date('2026-09-10T01:01:02.002Z'),
            finishedAt: null,
          }),
        },
        {
          // the failed run of the switched-off client, which the command reads as readily
          input: {
            runKey: 'run-key-10010009',
          },
          expected: expect.objectContaining({
            runKey: 'run-key-10010009',
            correlationId: 'correlation-id-10010009',
            externalRef: 'external-ref-10010009',
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            acceptedAt: new Date('2026-09-10T09:09:09.009Z'),
            startedAt: new Date('2026-09-10T09:09:10.010Z'),
            finishedAt: new Date('2026-09-10T09:09:11.011Z'),
          }),
        },
        {
          // the queued run, which started nothing and finished nothing
          input: {
            runKey: 'run-key-10010007',
          },
          expected: expect.objectContaining({
            runKey: 'run-key-10010007',
            correlationId: 'correlation-id-10010007',
            externalRef: 'external-ref-10010007',
            failureReasonCode: null,
            acceptedAt: new Date('2026-09-10T07:07:07.007Z'),
            startedAt: null,
            finishedAt: null,
          }),
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun)
          .toEqual(expected)
      })
    })

    describe('should answer a run of any client', () => {
      const cases = [
        {
          // client 10000001
          input: {
            runKey: 'run-key-10010004',
          },
          expected: 'run-key-10010004',
        },
        {
          // client 10000002
          input: {
            runKey: 'run-key-10010003',
          },
          expected: 'run-key-10010003',
        },
        {
          // client 10000003, which is switched off and whose runs the API answers to nobody
          input: {
            runKey: 'run-key-10010010',
          },
          expected: 'run-key-10010010',
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun.runKey)
          .toBe(expected)
      })
    })

    describe('should answer the status the run points at', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 'running',
        },
        {
          input: {
            runKey: 'run-key-10010009',
          },
          expected: 'failed',
        },
        {
          input: {
            runKey: 'run-key-10010010',
          },
          expected: 'canceled',
        },
        {
          input: {
            runKey: 'run-key-10010004',
          },
          expected: 'succeeded',
        },
        {
          input: {
            runKey: 'run-key-10010007',
          },
          expected: 'queued',
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun.AiRunStatus.name)
          .toBe(expected)
      })
    })

    describe('should answer the category the run points at', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 'asset-media-extraction',
        },
        {
          input: {
            runKey: 'run-key-10700004',
          },
          expected: 'asset-media-extraction',
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun.AiRunCategory.name)
          .toBe(expected)
      })
    })

    describe('should answer the steps in the order the run ran them', () => {
      const cases = [
        {
          // three steps, and the third has only begun — it is in the answer, because a
          // command opened on one run is opened on exactly that
          input: {
            runKey: 'run-key-10010001',
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
            expect.objectContaining({
              stepIndex: 3,
              stepName: 'read-media',
              outcomeCode: 'in-progress',
              finishedAt: null,
            }),
          ],
        },
        {
          input: {
            runKey: 'run-key-10010006',
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
              outcomeCode: 'step-canceled',
              reasonCode: 'canceled-before-completion',
            }),
          ],
        },
        {
          input: {
            runKey: 'run-key-10010005',
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
              outcomeCode: 'media-fetch-failed',
            }),
          ],
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRunSteps)
          .toEqual(expected)
      })
    })

    describe('should answer every step the run has, including the one still open', () => {
      test('for run-key-10010001', async () => {
        const input = {
          runKey: 'run-key-10010001',
        }

        // three, where a list row of the same run reads two
        const expected = 3

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRunSteps)
          .toHaveLength(expected)
      })
    })

    describe('should answer what carried each step out', () => {
      test('for run-key-10010001', async () => {
        const input = {
          runKey: 'run-key-10010001',
        }

        const expected = [
          expect.objectContaining({
            stepIndex: 1,
            AiRunStepCategory: expect.objectContaining({
              name: 'code',
            }),
          }),
          expect.objectContaining({
            stepIndex: 2,
            AiRunStepCategory: expect.objectContaining({
              name: 'code',
            }),
          }),
          expect.objectContaining({
            stepIndex: 3,
            AiRunStepCategory: expect.objectContaining({
              name: 'ai',
            }),
          }),
        ]

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRunSteps)
          .toEqual(expected)
      })
    })

    describe('should answer the model calls the run made', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010004',
          },
          expected: 3,
        },
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 1,
        },
        {
          input: {
            runKey: 'run-key-10010008',
          },
          expected: 2,
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiModelCalls)
          .toHaveLength(expected)
      })
    })

    describe('should answer a null run when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10900001',
          },
        },
        {
          // a prefix of a seeded key, which must not match it
          input: {
            runKey: 'run-key-1001000',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun)
          .toBeNull()
      })
    })

    describe('should answer no step when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10900002',
          },
        },
        {
          input: {
            runKey: 'run-key-10900003',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRunSteps)
          .toHaveLength(0)
      })
    })

    describe('should answer no model call when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10900004',
          },
        },
        {
          input: {
            runKey: 'run-key-10900005',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiModelCalls)
          .toHaveLength(0)
      })
    })

    describe('should change no run', () => {
      test('for run-key-10010001', async () => {
        const input = {
          runKey: 'run-key-10010001',
        }

        const createSpy = jest.spyOn(AiRun, 'create')
        const updateSpy = jest.spyOn(AiRun, 'update')
        const destroySpy = jest.spyOn(AiRun, 'destroy')
        const finder = AiRunOperatorFinder.create()

        await finder.findAiRunByRunKey(input)

        expect(createSpy)
          .not
          .toHaveBeenCalled()
        expect(updateSpy)
          .not
          .toHaveBeenCalled()
        expect(destroySpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiRunByRunKey()', () => {
    /*
     * The third criterion of section 16, asserted as the set of columns that were read.
     *
     * A reporter can only print what it was handed, so the guarantee that no content reaches a
     * terminal is a guarantee about the `SELECT`. `toEqual` on the whole of `dataValues` is exact
     * about the key set, so a column added to one of these queries later fails the case that names
     * the table — which is the point. `id` is asserted as anything rather than as a number because
     * the engine decides whether a `BIGINT` comes back as one.
     */
    describe('should read no column section 7 counts as content', () => {
      test('of a run', async () => {
        const input = {
          runKey: 'run-key-10010004',
        }

        // subjectLabel, requestBody and resultBody are absent, and so is ApiClientId
        const expected = {
          id: 10010004,
          runKey: 'run-key-10010004',
          correlationId: 'correlation-id-10010004',
          externalRef: 'external-ref-10010004',
          failureReasonCode: null,
          acceptedAt: new Date('2026-09-10T04:04:04.004Z'),
          startedAt: new Date('2026-09-10T04:04:05.005Z'),
          finishedAt: new Date('2026-09-10T04:04:06.006Z'),
          AiRunCategoryId: 1,
          AiRunStatusId: 3,
          AiRunStatus: expect.any(AiRunStatus),
          AiRunCategory: expect.any(AiRunCategory),
        }

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRun.dataValues)
          .toEqual(expected)
      })

      test('of a step', async () => {
        const input = {
          runKey: 'run-key-10010004',
        }

        // `rejections` is absent: it is the decision trace, kept 730 days against
        // content's 30, and a scrollback has no clock at all
        const expected = {
          AiRunId: 10010004,
          AiRunStepCategoryId: 1,
          stepIndex: 1,
          stepName: 'filter-suggestible-fields',
          outcomeCode: 'fields-kept',
          reasonCode: null,
          startedAt: new Date('2026-09-12T01:01:01.001Z'),
          finishedAt: new Date('2026-09-12T01:01:01.101Z'),
          AiRunStepCategory: expect.any(AiRunStepCategory),
        }

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiRunSteps[0].dataValues)
          .toEqual(expected)
      })

      test('of a model call', async () => {
        const input = {
          runKey: 'run-key-10010004',
        }

        // `responseBody` is the raw model output, and is absent
        const expected = {
          AiRunId: 10010004,
          inputTokenCount: 4801,
          outputTokenCount: 311,
        }

        const finder = AiRunOperatorFinder.create()

        const found = await finder.findAiRunByRunKey(input)

        expect(found.aiModelCalls[0].dataValues)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#buildFailedCondition()', () => {
    describe('should bound the read to the failed status, from the stated instant', () => {
      const cases = [
        {
          // 4 is the id of the failed status in `ai_run_statuses`
          input: {
            failedSince: new Date('2026-09-10T09:09:11.011Z'),
          },
          expected: {
            AiRunStatusId: 4,
            finishedAt: {
              [Op.gte]: new Date('2026-09-10T09:09:11.011Z'),
            },
          },
        },
        {
          input: {
            failedSince: new Date('2027-01-01T00:00:00.000Z'),
          },
          expected: {
            AiRunStatusId: 4,
            finishedAt: {
              [Op.gte]: new Date('2027-01-01T00:00:00.000Z'),
            },
          },
        },
      ]

      test.each(cases)('failedSince: $input.failedSince', ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = finder.buildFailedCondition(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiRuns()', () => {
    describe('should read the runs a condition names, across every client', () => {
      const cases = [
        {
          label: 'earliest first, unbounded',
          input: {
            whereClause: {
              correlationId: 'correlation-id-10700000',
            },
            order: [
              [
                'id',
                'ASC',
              ],
            ],
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700002',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700003',
            }),
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
          ],
        },
        {
          label: 'newest first, unbounded',
          input: {
            whereClause: {
              correlationId: 'correlation-id-10700000',
            },
            order: [
              [
                'id',
                'DESC',
              ],
            ],
            limit: null,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700004',
            }),
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
          label: 'earliest first, bounded to one',
          input: {
            whereClause: {
              correlationId: 'correlation-id-10700000',
            },
            order: [
              [
                'id',
                'ASC',
              ],
            ],
            limit: 1,
          },
          expected: [
            expect.objectContaining({
              runKey: 'run-key-10700001',
            }),
          ],
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiRuns(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read nothing when the condition names no run', () => {
      const cases = [
        {
          label: 'a correlation id nothing carries',
          input: {
            whereClause: {
              correlationId: 'correlation-id-10900006',
            },
            order: [
              [
                'id',
                'ASC',
              ],
            ],
            limit: null,
          },
        },
        {
          label: 'a run key nothing carries',
          input: {
            whereClause: {
              runKey: 'run-key-10900007',
            },
            order: [
              [
                'id',
                'ASC',
              ],
            ],
            limit: null,
          },
        },
      ]

      test.each(cases)('label: $label', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiRuns(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiRun()', () => {
    describe('should read the run a key names, whichever client owns it', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 'run-key-10010001',
        },
        {
          input: {
            runKey: 'run-key-10010003',
          },
          expected: 'run-key-10010003',
        },
        {
          input: {
            runKey: 'run-key-10010010',
          },
          expected: 'run-key-10010010',
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiRun(input)

        expect(received.runKey)
          .toBe(expected)
      })
    })

    describe('should read nothing when no run carries the key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10900008',
          },
        },
        {
          input: {
            runKey: 'run-key-10900009',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiRun(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#buildAiRunMasterIncludes()', () => {
    describe('should name the two master rows a run is read with', () => {
      const cases = [
        {
          input: {
            FinderCtor: AiRunOperatorFinder,
          },
          expected: [
            {
              model: AiRunStatus,
              attributes: [
                'id',
                'name',
              ],
            },
            {
              model: AiRunCategory,
              attributes: [
                'id',
                'name',
              ],
            },
          ],
        },
        {
          input: {
            FinderCtor: class DerivedAiRunOperatorFinder extends AiRunOperatorFinder {},
          },
          expected: [
            {
              model: AiRunStatus,
              attributes: [
                'id',
                'name',
              ],
            },
            {
              model: AiRunCategory,
              attributes: [
                'id',
                'name',
              ],
            },
          ],
        },
      ]

      test.each(cases)('FinderCtor: $input.FinderCtor.name', ({
        input,
        expected,
      }) => {
        const finder = input.FinderCtor.create()

        const received = finder.buildAiRunMasterIncludes()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#buildLimitOption()', () => {
    describe('should bound the read when a number was stated', () => {
      const cases = [
        {
          input: {
            limit: 1,
          },
          expected: {
            limit: 1,
          },
        },
        {
          input: {
            limit: 50,
          },
          expected: {
            limit: 50,
          },
        },
        {
          input: {
            limit: 0,
          },
          expected: {
            limit: 0,
          },
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = finder.buildLimitOption(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should bound the read by nothing when no number was stated', () => {
      const cases = [
        {
          input: {
            limit: null,
          },
          expected: {},
        },
        {
          // a limit that arrived as the text an operator typed, and was never converted
          input: {
            limit: '10',
          },
          expected: {},
        },
      ]

      test.each(cases)('limit: $input.limit', ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = finder.buildLimitOption(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#buildFoundAiRuns()', () => {
    describe('should hand back the runs it was given', () => {
      const cases = [
        {
          input: {
            aiRuns: [
              {
                id: 10010004,
              },
            ],
          },
          expected: 1,
        },
        {
          input: {
            aiRuns: [
              {
                id: 10010004,
              },
              {
                id: 10010003,
              },
            ],
          },
          expected: 2,
        },
      ]

      test.each(cases)('aiRuns[0].id: $input.aiRuns.0.id', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.buildFoundAiRuns(input)

        expect(received.aiRuns)
          .toHaveLength(expected)
      })
    })

    describe('should read the completed steps of those runs', () => {
      const cases = [
        {
          // run 10010004 finished all seven of its steps
          input: {
            aiRuns: [
              {
                id: 10010004,
              },
            ],
          },
          expected: 7,
        },
        {
          // run 10010001 has three steps and its third has not finished
          input: {
            aiRuns: [
              {
                id: 10010001,
              },
            ],
          },
          expected: 2,
        },
        {
          // run 10010003 belongs to client 10000002, so this pair straddles two clients
          input: {
            aiRuns: [
              {
                id: 10010005,
              },
              {
                id: 10010003,
              },
            ],
          },
          expected: 8,
        },
      ]

      test.each(cases)('aiRuns[0].id: $input.aiRuns.0.id', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.buildFoundAiRuns(input)

        expect(received.aiRunSteps)
          .toHaveLength(expected)
      })
    })

    describe('should read the model calls of those runs', () => {
      const cases = [
        {
          input: {
            aiRuns: [
              {
                id: 10010004,
              },
            ],
          },
          expected: 3,
        },
        {
          // one call of run 10010001 and two of run 10010008, which is another client's
          input: {
            aiRuns: [
              {
                id: 10010001,
              },
              {
                id: 10010008,
              },
            ],
          },
          expected: 3,
        },
      ]

      test.each(cases)('aiRuns[0].id: $input.aiRuns.0.id', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.buildFoundAiRuns(input)

        expect(received.aiModelCalls)
          .toHaveLength(expected)
      })
    })

    describe('should read no step when no run was found', () => {
      const cases = [
        {
          input: {
            aiRuns: [],
          },
        },
        {
          // a run that finished no step and called no model
          input: {
            aiRuns: [
              {
                id: 10010002,
              },
            ],
          },
        },
      ]

      test.each(cases)('aiRuns.length: $input.aiRuns.length', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.buildFoundAiRuns(input)

        expect(received.aiRunSteps)
          .toHaveLength(0)
      })
    })

    describe('should read no model call when no run was found', () => {
      const cases = [
        {
          input: {
            aiRuns: [],
          },
        },
        {
          input: {
            aiRuns: [
              {
                id: 10010002,
              },
            ],
          },
        },
      ]

      test.each(cases)('aiRuns.length: $input.aiRuns.length', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.buildFoundAiRuns(input)

        expect(received.aiModelCalls)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
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
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
          ],
        },
        {
          input: {
            aiRunIds: [
              10010005,
            ],
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
              outcomeCode: 'media-fetch-failed',
            }),
          ],
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findCompletedAiRunSteps(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read no step beyond the ones that finished', () => {
      const cases = [
        {
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
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findCompletedAiRunSteps(input)

        expect(received)
          .toHaveLength(expected)
      })
    })

    describe('should read the steps of runs of more than one client', () => {
      test('for runs 10010004 and 10010003', async () => {
        const input = {
          aiRunIds: [
            10010004,
            10010003,
          ],
        }

        // run 10010004 belongs to client 10000001 and run 10010003 to client 10000002:
        // seven steps and six
        const expected = 13

        const finder = AiRunOperatorFinder.create()

        const received = await finder.findCompletedAiRunSteps(input)

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
          // a run that has finished no step
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
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findCompletedAiRunSteps(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findOrderedAiRunSteps()', () => {
    describe('should read every step of the run, in the order it ran them', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010001,
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
            expect.objectContaining({
              stepIndex: 3,
              stepName: 'read-media',
              outcomeCode: 'in-progress',
              finishedAt: null,
            }),
          ],
        },
        {
          // a run of client 10000002, read exactly as the first client's is
          input: {
            aiRunId: 10010003,
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              stepName: 'filter-suggestible-fields',
            }),
            expect.objectContaining({
              stepIndex: 2,
              stepName: 'fetch-media',
            }),
            expect.objectContaining({
              stepIndex: 3,
              stepName: 'read-media',
            }),
            expect.objectContaining({
              stepIndex: 4,
              stepName: 'drop-disallowed-readings',
            }),
            expect.objectContaining({
              stepIndex: 5,
              stepName: 'settle-by-majority',
            }),
            expect.objectContaining({
              stepIndex: 6,
              stepName: 'score-confidence',
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findOrderedAiRunSteps(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read the step that has begun and not finished', () => {
      test('of run 10010001', async () => {
        const input = {
          aiRunId: 10010001,
        }

        // three, where `#findCompletedAiRunSteps()` reads two of the same run
        const expected = 3

        const finder = AiRunOperatorFinder.create()

        const received = await finder.findOrderedAiRunSteps(input)

        expect(received)
          .toHaveLength(expected)
      })
    })

    describe('should read what carried each step out', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010001,
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
            }),
            expect.objectContaining({
              stepIndex: 2,
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
            }),
            expect.objectContaining({
              stepIndex: 3,
              AiRunStepCategory: expect.objectContaining({
                name: 'ai',
              }),
            }),
          ],
        },
        {
          input: {
            aiRunId: 10010006,
          },
          expected: [
            expect.objectContaining({
              stepIndex: 1,
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
            }),
            expect.objectContaining({
              stepIndex: 2,
              AiRunStepCategory: expect.objectContaining({
                name: 'code',
              }),
            }),
          ],
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findOrderedAiRunSteps(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read nothing when the run has no step', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010002,
          },
        },
        {
          input: {
            aiRunId: 10700001,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findOrderedAiRunSteps(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunOperatorFinder', () => {
  describe('#findAiModelCalls()', () => {
    describe('should read every call the runs made', () => {
      const cases = [
        {
          input: {
            aiRunIds: [
              10010004,
            ],
          },
          // the calls are read under no order of their own, so the set is asserted
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
          // the switched-off client's failed run, whose one call is read all the same
          input: {
            aiRunIds: [
              10010009,
            ],
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              inputTokenCount: 1710,
              outputTokenCount: 210,
            }),
          ]),
        },
      ]

      test.each(cases)('aiRunIds[0]: $input.aiRunIds.0', async ({
        input,
        expected,
      }) => {
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiModelCalls(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should read the calls of runs of more than one client', () => {
      test('for runs 10010004, 10010008 and 10010009', async () => {
        const input = {
          aiRunIds: [
            10010004,
            10010008,
            10010009,
          ],
        }

        // three calls of run 10010004 (client 10000001), two of 10010008 (10000002)
        // and one of 10010009 (10000003)
        const expected = 6

        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiModelCalls(input)

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
          // a run that called no model
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
        const finder = AiRunOperatorFinder.create()

        const received = await finder.findAiModelCalls(input)

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})
