import AiRunResponseBuilder from '../../../../app/aiRun/AiRunResponseBuilder.js'
import AiRunStepRecorder from '../../../../app/aiRun/AiRunStepRecorder.js'

import AiModelCall from '../../../../sequelize/models/AiModelCall.js'
import AiRun from '../../../../sequelize/models/AiRun.js'
import AiRunCategory from '../../../../sequelize/models/AiRunCategory.js'
import AiRunFieldOutcome from '../../../../sequelize/models/AiRunFieldOutcome.js'
import AiRunStatus from '../../../../sequelize/models/AiRunStatus.js'

/*
 * The body both callers of section 12 answer with: `GET /v1/ai-runs/:runKey` and the terminal
 * callback. Every acceptance criterion about the shape of an answer is read here.
 *
 * **Nothing is written, and nothing about the join is mocked.** The runs, their steps, their
 * settled fields and their model calls are the development seeders', so the body asserted below
 * is one this application really assembled out of five tables. A body built from stubbed rows
 * would prove that the assembly runs and nothing about whether the reads find the right rows.
 *
 * **`engine.label` and `result` are read off a seeded row now**, and not off an entity written out
 * here. Run 10010004 carries `engine_label` and `result_body`, so `#buildAiRunResponse()`'s own
 * describe reads both end to end out of the table — which is the fourth acceptance criterion of
 * section 12 read against what the database really holds. Run 10010003 carries neither, on
 * purpose, so the answer for a succeeded run holding no engine label and no stored result is read
 * off a row as well.
 *
 * **`failure.parameters` still has no row behind it, and that is the contract's answer rather than
 * a gap.** `MEDIA_LIMIT_EXCEEDED` is the one reason code of the seven that carries parameters at
 * all ([[Q103]]), and neither failed run carries that code — 10010005 failed under
 * `MEDIA_UNREADABLE` and 10010009 under `PROVIDER_CALL_FAILED`, and the contract names no
 * parameters for either. The parameters-carrying case is therefore read on a run written out in
 * the case, as it was, and the shortfall is reported rather than papered over.
 *
 * **The describes that take a value or an entity as their argument still write one out**, because
 * there is nothing for them to read: `#buildEngine()`, `#buildResult()`, `#parseResultBody()`,
 * `#buildFailure()` and `#buildFoundAiRunResponse()` are each handed what they work on. A row
 * reaches them only through `#buildAiRunResponse()`, which is where it is now read.
 */

describe('AiRunResponseBuilder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunStepRecorder', () => {
        const cases = [
          {
            input: {
              aiRunStepRecorder: AiRunStepRecorder.create(),
            },
            label: 'the real step recorder',
          },
          {
            input: {
              aiRunStepRecorder: {
                findAiRunSteps: () => [],
              },
            },
            label: 'a stand-in answering no step',
          },
        ]

        test.each(cases)('label: $label', ({
          input,
        }) => {
          const builder = new AiRunResponseBuilder(input)

          expect(builder)
            .toHaveProperty('aiRunStepRecorder', input.aiRunStepRecorder)
        })
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.create()', () => {
    describe('should be instance of own class', () => {
      const cases = [
        {
          input: {
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
          label: 'the real step recorder',
        },
        {
          input: {
            aiRunStepRecorder: {
              findAiRunSteps: () => [],
            },
          },
          label: 'a stand-in answering no step',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const actual = AiRunResponseBuilder.create(input)

        expect(actual)
          .toBeInstanceOf(AiRunResponseBuilder)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
          label: 'the real step recorder',
        },
        {
          input: {
            aiRunStepRecorder: {
              findAiRunSteps: () => [],
            },
          },
          label: 'a stand-in answering no step',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunResponseBuilder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.create()', () => {
    describe('should use default aiRunStepRecorder value', () => {
      test('with no arguments', () => {
        const createRecorderSpy = jest.spyOn(AiRunResponseBuilder, 'createAiRunStepRecorder')

        const builder = AiRunResponseBuilder.create()

        expect(builder.aiRunStepRecorder)
          .toBeInstanceOf(AiRunStepRecorder)
        expect(createRecorderSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.createAiRunStepRecorder()', () => {
    describe('when called as is', () => {
      test('should build the recorder the trace is read through', () => {
        const actual = AiRunResponseBuilder.createAiRunStepRecorder()

        expect(actual)
          .toBeInstanceOf(AiRunStepRecorder)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.get:AiRunCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunResponseBuilder.AiRunCtor

        expect(actual)
          .toBe(AiRun) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.get:AiRunStatusCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunResponseBuilder.AiRunStatusCtor

        expect(actual)
          .toBe(AiRunStatus) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.get:AiRunCategoryCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunResponseBuilder.AiRunCategoryCtor

        expect(actual)
          .toBe(AiRunCategory) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.get:AiRunFieldOutcomeCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunResponseBuilder.AiRunFieldOutcomeCtor

        expect(actual)
          .toBe(AiRunFieldOutcome) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('.get:AiModelCallCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = AiRunResponseBuilder.AiModelCallCtor

        expect(actual)
          .toBe(AiModelCall) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#get:Ctor', () => {
    describe('should answer own constructor', () => {
      const cases = [
        {
          input: {
            aiRunStepRecorder: AiRunStepRecorder.create(),
          },
          label: 'the real step recorder',
        },
        {
          input: {
            aiRunStepRecorder: {
              findAiRunSteps: () => [],
            },
          },
          label: 'a stand-in answering no step',
        },
      ]

      test.each(cases)('label: $label', ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create(input)

        const actual = builder.Ctor

        expect(actual)
          .toBe(AiRunResponseBuilder) // same reference
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#findAiRun()', () => {
    /*
     * The run is loaded with the two masters whose names the body carries, so a reader that forgot
     * an include would fail here rather than at the field that reads it.
     */
    describe('when the client owns a run under that key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010004',
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            id: 10010004,
            ApiClientId: 10000001,
            runKey: 'run-key-10010004',
            engineLabel: 'asset-media-extraction-loop@stub',
            AiRunStatus: expect.objectContaining({
              name: 'succeeded',
            }),
            AiRunCategory: expect.objectContaining({
              name: 'asset-media-extraction',
            }),
          }),
        },
        {
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000002,
          },
          expected: expect.objectContaining({
            id: 10010003,
            ApiClientId: 10000002,
            runKey: 'run-key-10010003',
            engineLabel: null, // the succeeded run that carries none
            AiRunStatus: expect.objectContaining({
              name: 'succeeded',
            }),
            AiRunCategory: expect.objectContaining({
              name: 'asset-media-extraction',
            }),
          }),
        },
        {
          input: {
            runKey: 'run-key-10010006',
            apiClientId: 10000001,
          },
          expected: expect.objectContaining({
            id: 10010006,
            ApiClientId: 10000001,
            runKey: 'run-key-10010006',
            AiRunStatus: expect.objectContaining({
              name: 'canceled',
            }),
          }),
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiRun(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The ninth acceptance criterion of section 12: reading a run that belongs to another client
     * answers as though the run did not exist, and says nothing about whether it does.
     *
     * The first three cases are run keys that really are in the table, asked for by a client that
     * does not own them; the last is a key nothing carries. The two answer identically, which is
     * the whole point — and because the client is part of the condition, the row of another client
     * is never loaded at all.
     */
    describe('when the client owns no run under that key', () => {
      const cases = [
        {
          // 10010004 belongs to the signing client
          input: {
            runKey: 'run-key-10010004',
            apiClientId: 10000002,
          },
        },
        {
          // 10010003 belongs to the rotating client
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000001,
          },
        },
        {
          // 10010009 belongs to the switched-off client
          input: {
            runKey: 'run-key-10010009',
            apiClientId: 10000001,
          },
        },
        {
          input: {
            runKey: 'run-key-that-no-run-carries',
            apiClientId: 10000001,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiRun(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#findAiRunFieldOutcomes()', () => {
    /*
     * The two runs the development seeder settled fields on carry a different number of them and a
     * different formula version, so a read that ignored the run it was handed would answer the
     * wrong count and the wrong version rather than something that looks right either way.
     */
    describe('when the run settled fields', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
          },
          expected: 8,
        },
        {
          input: {
            aiRunId: 10010003,
          },
          expected: 4,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiRunFieldOutcomes(input)

        expect(actual)
          .toHaveLength(expected)
      })
    })

    describe('when the run settled no field', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010001,
          },
        },
        {
          input: {
            aiRunId: 10010005,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiRunFieldOutcomes(input)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#findAiModelCalls()', () => {
    /*
     * The calls are a set rather than a sequence here: nothing about what a run spent depends on
     * which order the rows come back in, so the read states none and the assertion asks for none.
     * The paired length keeps a row from going missing unnoticed.
     */
    describe('when the run called a model', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
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
          expectedLength: 3,
        },
        {
          input: {
            aiRunId: 10010006,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              inputTokenCount: 2706,
              outputTokenCount: 166,
            }),
            expect.objectContaining({
              inputTokenCount: 2707,
              outputTokenCount: 177,
            }),
          ]),
          expectedLength: 2,
        },
        {
          input: {
            aiRunId: 10010010,
          },
          expected: expect.arrayContaining([
            expect.objectContaining({
              inputTokenCount: 1508,
              outputTokenCount: 188,
            }),
          ]),
          expectedLength: 1,
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
        expectedLength,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiModelCalls(input)

        expect(actual)
          .toEqual(expected)
        expect(actual)
          .toHaveLength(expectedLength)
      })
    })

    describe('when the run called no model', () => {
      const cases = [
        {
          // queued
          input: {
            aiRunId: 10010002,
          },
        },
        {
          // failed on its media before any reading
          input: {
            aiRunId: 10010005,
          },
        },
        {
          // queued, under the rotating client
          input: {
            aiRunId: 10010007,
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.findAiModelCalls(input)

        expect(actual)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#extractConfidenceMethodVersion()', () => {
    /*
     * [[Q92]] answered: the version every settled field shares.
     *
     * The rows are written out here rather than read back, because the case that decides the
     * question — one run scored under two versions — is one the seeder deliberately does not
     * contain, and could not contain without stating that a defect is normal. The rows this reads
     * are two strings, so nothing about a row is being stubbed away.
     */
    describe('when every settled field shares one version', () => {
      const cases = [
        {
          input: {
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
            ],
          },
          expected: 'confidence-v1.0.0',
        },
        {
          input: {
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.1.0',
              },
            ],
          },
          expected: 'confidence-v1.1.0',
        },
      ]

      test.each(cases)('confidenceMethodVersion: $input.aiRunFieldOutcomes.0.confidenceMethodVersion', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.extractConfidenceMethodVersion(input)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * Two versions on one run is a defect in whatever scored it, not a state the client is meant
     * to reconcile — so the field says no single version scored this run rather than naming one
     * that scored part of it. Neither the newest nor the oldest is answered, which is what the
     * third case pins: the versions are given newest first there and oldest first in the second,
     * and both answer null.
     */
    describe('when the settled fields disagree on the version', () => {
      const cases = [
        {
          input: {
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.1.0',
              },
            ],
          },
        },
        {
          input: {
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.1.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
            ],
          },
        },
      ]

      test.each(cases)('confidenceMethodVersion: $input.aiRunFieldOutcomes.0.confidenceMethodVersion', ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.extractConfidenceMethodVersion(input)

        expect(actual)
          .toBeNull()
      })
    })

    describe('when the run settled no field', () => {
      test('with no settled field at all', () => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.extractConfidenceMethodVersion({
          aiRunFieldOutcomes: [],
        })

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildEngine()', () => {
    /*
     * The two facts `engine` carries are held at two grains: the label is one string on the run,
     * and the version is per settled field. A run that never reached a worker carries neither.
     */
    describe('should answer the label and the one version', () => {
      const cases = [
        {
          input: {
            aiRun: {
              engineLabel: 'asset-media-extraction-loop@stub',
            },
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
            ],
          },
          expected: {
            label: 'asset-media-extraction-loop@stub',
            confidenceMethodVersion: 'confidence-v1.0.0',
          },
        },
        {
          input: {
            aiRun: {
              engineLabel: 'asset-media-extraction-loop@claude',
            },
            aiRunFieldOutcomes: [
              {
                confidenceMethodVersion: 'confidence-v1.1.0',
              },
              {
                confidenceMethodVersion: 'confidence-v1.0.0',
              },
            ],
          },
          expected: {
            label: 'asset-media-extraction-loop@claude',
            confidenceMethodVersion: null,
          },
        },
        {
          input: {
            aiRun: {
              engineLabel: null,
            },
            aiRunFieldOutcomes: [],
          },
          expected: {
            label: null,
            confidenceMethodVersion: null,
          },
        },
      ]

      test.each(cases)('engineLabel: $input.aiRun.engineLabel', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildEngine(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildEmptyUsage()', () => {
    describe('when called as is', () => {
      test('should answer three zeros', () => {
        const expected = {
          modelCallCount: 0,
          inputTokenCount: 0,
          outputTokenCount: 0,
        }

        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildEmptyUsage()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildUsage()', () => {
    /*
     * The token counts are all distinct and none of them repeats, so a sum that added a column to
     * itself, or added the wrong column, lands on a number no case expects.
     */
    describe('should answer what the run spent', () => {
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
          expected: {
            modelCallCount: 3,
            inputTokenCount: 14406,
            outputTokenCount: 966,
          },
        },
        {
          input: {
            aiModelCalls: [
              {
                inputTokenCount: 1508,
                outputTokenCount: 188,
              },
            ],
          },
          expected: {
            modelCallCount: 1,
            inputTokenCount: 1508,
            outputTokenCount: 188,
          },
        },
      ]

      test.each(cases)('inputTokenCount: $input.aiModelCalls.0.inputTokenCount', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildUsage(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when the run called no model', () => {
      test('with no call at all', () => {
        const expected = {
          modelCallCount: 0,
          inputTokenCount: 0,
          outputTokenCount: 0,
        }

        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildUsage({
          aiModelCalls: [],
        })

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#parseResultBody()', () => {
    describe('when the body is JSON', () => {
      const cases = [
        {
          input: {
            resultBody: '{"missingFieldPaths":["attributes.buildYear"]}',
          },
          expected: {
            missingFieldPaths: [
              'attributes.buildYear',
            ],
          },
        },
        {
          input: {
            resultBody: '[1,2,3]',
          },
          expected: [
            1,
            2,
            3,
          ],
        },
        {
          input: {
            resultBody: '"a string result"',
          },
          expected: 'a string result',
        },
      ]

      test.each(cases)('resultBody: $input.resultBody', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.parseResultBody(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    describe('when the body is not JSON', () => {
      const cases = [
        {
          input: {
            resultBody: 'not json at all',
          },
        },
        {
          input: {
            resultBody: '{"unclosed":',
          },
        },
        {
          input: {
            resultBody: '',
          },
        },
      ]

      test.each(cases)('resultBody: $input.resultBody', ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.parseResultBody(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildResult()', () => {
    /*
     * The stored body is handed back as it was written, including whatever number form the service
     * wrote its confidences in — this class re-types nothing. `suggestionConfidence` is a JSON
     * number on the wire ([[Q98]]), and the body is where that decision is kept; the first case is
     * the shape section 20's own worker renders.
     */
    describe('when the run carries a result', () => {
      const cases = [
        {
          input: {
            aiRun: {
              resultBody: '{"fields":[{"path":"attributes.floorArea","value":"88","fieldStateName":"extracted","suggestionConfidence":1,"reason":"Written on the plan.","sourceMediaKeys":["media-key-10410001"],"agreement":{"agreedReadingCount":3,"totalReadingCount":3}}],"missingFieldPaths":["attributes.buildYear"],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10010004"}',
            },
          },
          expected: {
            fields: [
              {
                path: 'attributes.floorArea',
                value: '88',
                fieldStateName: 'extracted',
                suggestionConfidence: 1,
                reason: 'Written on the plan.',
                sourceMediaKeys: [
                  'media-key-10410001',
                ],
                agreement: {
                  agreedReadingCount: 3,
                  totalReadingCount: 3,
                },
              },
            ],
            missingFieldPaths: [
              'attributes.buildYear',
            ],
            unreadableMediaKeys: [],
            mediaSignature: 'media-signature-10010004',
          },
        },
        {
          // a result that settled nothing is still a result, and the run still succeeded
          input: {
            aiRun: {
              resultBody: '{"fields":[],"missingFieldPaths":["attributes.alleyWidth"],"unreadableMediaKeys":["media-key-10410009"],"mediaSignature":"media-signature-10010003"}',
            },
          },
          expected: {
            fields: [],
            missingFieldPaths: [
              'attributes.alleyWidth',
            ],
            unreadableMediaKeys: [
              'media-key-10410009',
            ],
            mediaSignature: 'media-signature-10010003',
          },
        },
      ]

      test.each(cases)('resultBody: $input.aiRun.resultBody', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildResult(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * One rule rather than three: the column holds no object. A run that has not succeeded wrote
     * none, a run past the content purge had its own removed, and a body that is not an object is
     * not a result whatever else it is — an array and a bare string included, because the field is
     * declared as an object or null and a client that met either would have no shape to read.
     */
    describe('when the run carries no result', () => {
      const cases = [
        {
          input: {
            aiRun: {
              resultBody: null,
            },
          },
        },
        {
          input: {
            aiRun: {
              resultBody: 'not json at all',
            },
          },
        },
        {
          input: {
            aiRun: {
              resultBody: '[1,2,3]',
            },
          },
        },
        {
          input: {
            aiRun: {
              resultBody: '"a string result"',
            },
          },
        },
        {
          input: {
            aiRun: {
              resultBody: '123',
            },
          },
        },
      ]

      test.each(cases)('resultBody: $input.aiRun.resultBody', ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildResult(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildFailure()', () => {
    /*
     * The sixth acceptance criterion of section 12: a failed run's body carries a reason code and
     * its parameters, and no result.
     *
     * The parameters of `MEDIA_LIMIT_EXCEEDED` are written here as
     * `{ limitName, limitValue, declaredValue }`, which is the shape `AiRunMediaLimitInspector`
     * already builds and tests. The contract names no fields for it, and the canned body of the
     * stub renderer spells it a second way; that conflict is resolved towards this one and
     * reported, because it is the spelling that says which of the two limits was exceeded and so
     * covers the byte cap as well as the count.
     */
    describe('when the run failed', () => {
      const cases = [
        {
          input: {
            aiRun: {
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                limitName: 'mediaCount',
                limitValue: 12,
                declaredValue: 17,
              },
            },
          },
          expected: {
            reasonCode: 'MEDIA_LIMIT_EXCEEDED',
            parameters: {
              limitName: 'mediaCount',
              limitValue: 12,
              declaredValue: 17,
            },
          },
        },
        {
          input: {
            aiRun: {
              failureReasonCode: 'MEDIA_UNREADABLE',
              failureParameters: null,
            },
          },
          expected: {
            reasonCode: 'MEDIA_UNREADABLE',
            parameters: null,
          },
        },
        {
          input: {
            aiRun: {
              failureReasonCode: 'TIME_LIMIT_EXCEEDED',
              failureParameters: {
                limitName: 'runSeconds',
                limitValue: 300,
                declaredValue: 301,
              },
            },
          },
          expected: {
            reasonCode: 'TIME_LIMIT_EXCEEDED',
            parameters: {
              limitName: 'runSeconds',
              limitValue: 300,
              declaredValue: 301,
            },
          },
        },
      ]

      test.each(cases)('failureReasonCode: $input.aiRun.failureReasonCode', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildFailure(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The reason code decides this field and the status does not, so a run that carries no code
     * carries no failure whatever state it is in — a succeeded run records none, and a queued run
     * has nothing to record yet.
     */
    describe('when the run did not fail', () => {
      const cases = [
        {
          input: {
            aiRun: {
              failureReasonCode: null,
              failureParameters: null,
            },
          },
        },
        {
          input: {
            aiRun: {
              failureReasonCode: null,
              failureParameters: {
                limitName: 'mediaCount',
              },
            },
          },
        },
      ]

      test.each(cases)('failureParameters: $input.aiRun.failureParameters', ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildFailure(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildAiRunStepResponse()', () => {
    /*
     * [[Q93]] kept: seven fields, and `rejections` is not among them. Each step below carries one,
     * so a builder that spread the row instead of writing the fields out would put on this surface
     * a column that outlives the content purge by two years.
     */
    describe('should answer the seven fields of one step, and no other', () => {
      const cases = [
        {
          input: {
            aiRunStep: {
              stepIndex: 5,
              stepName: 'settle-by-majority',
              AiRunStepCategory: {
                name: 'code',
              },
              outcomeCode: 'fields-settled',
              reasonCode: 'majority-not-reached-for-some-fields',
              rejections: [
                {
                  fieldPath: 'attributes.buildYear',
                  reasonCode: 'below_agreement_threshold',
                  figures: {
                    agreedReadingCount: 2,
                  },
                },
              ],
              startedAt: new Date('2026-09-12T01:01:13.013Z'),
              finishedAt: new Date('2026-09-12T01:01:13.513Z'),
            },
          },
          expected: {
            stepIndex: 5,
            stepName: 'settle-by-majority',
            stepCategoryName: 'code',
            outcomeCode: 'fields-settled',
            reasonCode: 'majority-not-reached-for-some-fields',
            startedAt: new Date('2026-09-12T01:01:13.013Z'),
            finishedAt: new Date('2026-09-12T01:01:13.513Z'),
          },
        },
        {
          // a step still running, so `finishedAt` is read null rather than assumed present
          input: {
            aiRunStep: {
              stepIndex: 3,
              stepName: 'read-media',
              AiRunStepCategory: {
                name: 'ai',
              },
              outcomeCode: 'in-progress',
              reasonCode: null,
              rejections: null,
              startedAt: new Date('2026-09-12T04:04:05.005Z'),
              finishedAt: null,
            },
          },
          expected: {
            stepIndex: 3,
            stepName: 'read-media',
            stepCategoryName: 'ai',
            outcomeCode: 'in-progress',
            reasonCode: null,
            startedAt: new Date('2026-09-12T04:04:05.005Z'),
            finishedAt: null,
          },
        },
        {
          input: {
            aiRunStep: {
              stepIndex: 7,
              stepName: 'await-owner-decision',
              AiRunStepCategory: {
                name: 'human',
              },
              outcomeCode: 'decision-recorded',
              reasonCode: null,
              rejections: null,
              startedAt: new Date('2026-09-12T01:01:15.015Z'),
              finishedAt: new Date('2026-09-12T01:01:45.715Z'),
            },
          },
          expected: {
            stepIndex: 7,
            stepName: 'await-owner-decision',
            stepCategoryName: 'human',
            outcomeCode: 'decision-recorded',
            reasonCode: null,
            startedAt: new Date('2026-09-12T01:01:15.015Z'),
            finishedAt: new Date('2026-09-12T01:01:45.715Z'),
          },
        },
      ]

      test.each(cases)('stepName: $input.aiRunStep.stepName', ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = builder.buildAiRunStepResponse(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildStepsExpansion()', () => {
    /*
     * The fifth acceptance criterion of section 12, first half: asking for the step trace adds it
     * to the response. The steps are the development seeder's, in the order they claim in
     * `step_index`, and they are read through `AiRunStepRecorder` rather than through a query of
     * this class's own.
     */
    describe('when the trace was asked for', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010005,
            expandsSteps: true,
          },
          expected: {
            steps: [
              {
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
                stepCategoryName: 'code',
                outcomeCode: 'fields-kept',
                reasonCode: null,
                startedAt: new Date('2026-09-12T03:03:01.001Z'),
                finishedAt: new Date('2026-09-12T03:03:01.301Z'),
              },
              {
                stepIndex: 2,
                stepName: 'fetch-media',
                stepCategoryName: 'code',
                outcomeCode: 'media-fetch-failed',
                reasonCode: 'media-unreadable',
                startedAt: new Date('2026-09-12T03:03:02.002Z'),
                finishedAt: new Date('2026-09-12T03:03:05.902Z'),
              },
            ],
          },
        },
        {
          input: {
            aiRunId: 10010006,
            expandsSteps: true,
          },
          expected: {
            steps: [
              {
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
                stepCategoryName: 'code',
                outcomeCode: 'fields-kept',
                reasonCode: null,
                startedAt: new Date('2026-09-12T05:05:01.001Z'),
                finishedAt: new Date('2026-09-12T05:05:01.501Z'),
              },
              {
                stepIndex: 2,
                stepName: 'fetch-media',
                stepCategoryName: 'code',
                outcomeCode: 'step-canceled',
                reasonCode: 'canceled-before-completion',
                startedAt: new Date('2026-09-12T05:05:02.002Z'),
                finishedAt: new Date('2026-09-12T05:05:03.902Z'),
              },
            ],
          },
        },
        {
          // a run with no step yet still answers a key, and it holds an empty list
          input: {
            aiRunId: 10010002,
            expandsSteps: true,
          },
          expected: {
            steps: [],
          },
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildStepsExpansion(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The second half of the criterion: a response that did not ask for the trace carries none.
     * The key is absent rather than null — the two are different answers to "was a trace asked
     * for", and a client reading `steps` would otherwise be told the run had no step.
     *
     * The runs here all have steps on the record, so an expansion that ignored the flag would
     * answer with them.
     */
    describe('when the trace was not asked for', () => {
      const cases = [
        {
          input: {
            aiRunId: 10010004,
            expandsSteps: false,
          },
          expected: {},
        },
        {
          input: {
            aiRunId: 10010003,
            expandsSteps: false,
          },
          expected: {},
        },
        {
          input: {
            aiRunId: 10010001,
            expandsSteps: false,
          },
          expected: {},
        },
      ]

      test.each(cases)('aiRunId: $input.aiRunId', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildStepsExpansion(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildFoundAiRunResponse()', () => {
    /*
     * This method is handed the run it answers for, so the run is written out in the case — that
     * is its contract, and not a stand-in for a row it could have read. The run ids are seeded
     * ones, so the settled fields, the model calls and the steps underneath are all read for real.
     *
     * The first case's `resultBody` is deliberately **not** the body run 10010004 really carries,
     * which is longer and is asserted against the table in `#buildAiRunResponse()` below. Handing
     * this method a body the row does not hold is what proves it answers out of the entity it was
     * given rather than re-reading the run behind its back.
     *
     * `failureParameters` is still stated rather than read, because no seeded run carries a reason
     * code the contract gives parameters to ([[Q103]]). That one is the fixture's gap, and it is
     * reported rather than papered over.
     */
    describe('should answer a body carrying what the run itself holds', () => {
      const cases = [
        {
          input: {
            aiRun: {
              id: 10010004,
              runKey: 'run-key-10010004',
              externalRef: 'external-ref-10010004',
              subjectLabel: 'Subject label of run 10010004',
              correlationId: 'correlation-id-10010004',
              engineLabel: 'asset-media-extraction-loop@stub',
              resultBody: '{"mediaSignature":"media-signature-10010004"}',
              failureReasonCode: null,
              failureParameters: null,
              AiRunStatus: {
                name: 'succeeded',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010004',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010004',
            subjectLabel: 'Subject label of run 10010004',
            correlationId: 'correlation-id-10010004',
            statusName: 'succeeded',
            engine: {
              label: 'asset-media-extraction-loop@stub',
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
            usage: {
              modelCallCount: 3,
              inputTokenCount: 14406,
              outputTokenCount: 966,
            },
            result: {
              mediaSignature: 'media-signature-10010004',
            },
            failure: null,
          },
        },
        {
          // the sixth criterion: a failed run carries a reason code and its parameters, and no
          // result
          input: {
            aiRun: {
              id: 10010005,
              runKey: 'run-key-10010005',
              externalRef: 'external-ref-10010005',
              subjectLabel: 'Subject label of run 10010005',
              correlationId: 'correlation-id-10010005',
              engineLabel: 'asset-media-extraction-loop@stub',
              resultBody: null,
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                limitName: 'mediaCount',
                limitValue: 12,
                declaredValue: 17,
              },
              AiRunStatus: {
                name: 'failed',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010005',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010005',
            subjectLabel: 'Subject label of run 10010005',
            correlationId: 'correlation-id-10010005',
            statusName: 'failed',
            engine: {
              label: 'asset-media-extraction-loop@stub',
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
            },
            result: null,
            failure: {
              reasonCode: 'MEDIA_LIMIT_EXCEEDED',
              parameters: {
                limitName: 'mediaCount',
                limitValue: 12,
                declaredValue: 17,
              },
            },
          },
        },
        {
          // the seventh criterion: a canceled run reports the model calls and tokens spent up to
          // the stop
          input: {
            aiRun: {
              id: 10010006,
              runKey: 'run-key-10010006',
              externalRef: 'external-ref-10010006',
              subjectLabel: 'Subject label of run 10010006',
              correlationId: 'correlation-id-10010006',
              engineLabel: 'asset-media-extraction-loop@stub',
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
              AiRunStatus: {
                name: 'canceled',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010006',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010006',
            subjectLabel: 'Subject label of run 10010006',
            correlationId: 'correlation-id-10010006',
            statusName: 'canceled',
            engine: {
              label: 'asset-media-extraction-loop@stub',
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 2,
              inputTokenCount: 5413,
              outputTokenCount: 343,
            },
            result: null,
            failure: null,
          },
        },
        {
          // a queued run: nothing spent, nothing settled, and no engine to name
          input: {
            aiRun: {
              id: 10010002,
              runKey: 'run-key-10010002',
              externalRef: 'external-ref-10010002',
              subjectLabel: 'Subject label of run 10010002',
              correlationId: 'correlation-id-10010002',
              engineLabel: null,
              resultBody: null,
              failureReasonCode: null,
              failureParameters: null,
              AiRunStatus: {
                name: 'queued',
              },
              AiRunCategory: {
                name: 'asset-media-extraction',
              },
            },
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010002',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010002',
            subjectLabel: 'Subject label of run 10010002',
            correlationId: 'correlation-id-10010002',
            statusName: 'queued',
            engine: {
              label: null,
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
            },
            result: null,
            failure: null,
          },
        },
      ]

      test.each(cases)('runKey: $input.aiRun.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildFoundAiRunResponse(input)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunResponseBuilder', () => {
  describe('#buildAiRunResponse()', () => {
    /*
     * The fourth acceptance criterion of section 12 read end to end: this is the body the terminal
     * callback carries and the body `GET /v1/ai-runs/:runKey` answers with, and it is one method
     * because two shapes for one answer is what the reconciliation path exists to avoid.
     *
     * Every value is the development seeders', joined across `ai_runs`, `ai_run_statuses`,
     * `ai_run_categories`, `ai_run_field_outcomes` and `ai_model_calls` — `engine.label` and
     * `result` included. Run 10010004 carries both columns, so the first case reads the whole
     * body, result and all, out of the table; run 10010003 carries neither, so the second reads
     * what a succeeded run holding no engine label and no stored result answers with. The two are
     * what make this criterion an assertion about the database rather than about a hand-written
     * entity.
     *
     * The result of 10010004 is the one its own rows settled: the six paths of
     * `ai_run_field_outcomes` that came out with a value, at the scores and agreement counts those
     * rows carry, and the two that no majority settled under `missingFieldPaths`. Read it beside
     * the seeder and a body that had drifted from the rows it claims to summarize would show up
     * here.
     */
    describe('when the client owns the run', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010004',
            apiClientId: 10000001,
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010004',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010004',
            subjectLabel: 'Subject label of run 10010004',
            correlationId: 'correlation-id-10010004',
            statusName: 'succeeded',
            engine: {
              label: 'asset-media-extraction-loop@stub',
              confidenceMethodVersion: 'confidence-v1.0.0',
            },
            usage: {
              modelCallCount: 3,
              inputTokenCount: 14406,
              outputTokenCount: 966,
            },
            result: {
              fields: [
                {
                  path: 'attributes.floorArea',
                  value: '86.5',
                  fieldStateName: 'extracted',
                  suggestionConfidence: 1,
                  reason: 'The floor area is printed on the plan itself.',
                  sourceMediaKeys: [
                    'media-key-floor-plan',
                  ],
                  agreement: {
                    agreedReadingCount: 3,
                    totalReadingCount: 3,
                  },
                },
                {
                  path: 'attributes.bedroomCount',
                  value: '3',
                  fieldStateName: 'extracted',
                  suggestionConfidence: 0.84,
                  reason: 'Three rooms are marked as bedrooms on the plan.',
                  sourceMediaKeys: [
                    'media-key-floor-plan',
                    'media-key-living-room',
                  ],
                  agreement: {
                    agreedReadingCount: 2,
                    totalReadingCount: 3,
                  },
                },
                {
                  path: 'attributes.facadeWidth',
                  value: '4.2',
                  fieldStateName: 'derived',
                  suggestionConfidence: 0.65,
                  reason: 'Estimated from the front of the building against the doorway beside it.',
                  sourceMediaKeys: [
                    'media-key-front-elevation',
                  ],
                  agreement: {
                    agreedReadingCount: 4,
                    totalReadingCount: 5,
                  },
                },
                {
                  path: 'attributes.roadWidth',
                  value: '7.5',
                  fieldStateName: 'derived',
                  suggestionConfidence: 0.51,
                  reason: 'Estimated from the two parked cars across the road in front.',
                  sourceMediaKeys: [
                    'media-key-front-elevation',
                    'media-key-balcony-view',
                  ],
                  agreement: {
                    agreedReadingCount: 2,
                    totalReadingCount: 3,
                  },
                },
                {
                  path: 'attributes.legalStatusSlug',
                  value: 'legal-status-full-title',
                  fieldStateName: 'suggested',
                  suggestionConfidence: 0.33,
                  reason: 'Taken from what this asset category usually holds, with no document photographed.',
                  sourceMediaKeys: [],
                  agreement: {
                    agreedReadingCount: 3,
                    totalReadingCount: 5,
                  },
                },
                {
                  path: 'attributes.furnishingSlug',
                  value: 'furnishing-fully-fitted',
                  fieldStateName: 'suggested',
                  suggestionConfidence: 0.0125,
                  reason: 'Taken from the asset category alone, and agreed on by the barest majority.',
                  sourceMediaKeys: [],
                  agreement: {
                    agreedReadingCount: 2,
                    totalReadingCount: 3,
                  },
                },
              ],
              missingFieldPaths: [
                'attributes.balconyDirectionSlug',
                'attributes.buildYear',
              ],
              unreadableMediaKeys: [],
              mediaSignature: 'media-signature-10010004',
            },
            failure: null,
          },
        },
        {
          // the other run that succeeded, carrying neither column — so the null side of both
          // fields is read off a row as well, and on a succeeded run rather than only on one that
          // never reached a worker
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000002,
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010003',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010003',
            subjectLabel: 'Subject label of run 10010003',
            correlationId: 'correlation-id-10010003',
            statusName: 'succeeded',
            engine: {
              label: null,
              confidenceMethodVersion: 'confidence-v1.1.0',
            },
            usage: {
              modelCallCount: 2,
              inputTokenCount: 7809,
              outputTokenCount: 499,
            },
            result: null,
            failure: null,
          },
        },
        {
          input: {
            runKey: 'run-key-10010005',
            apiClientId: 10000001,
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010005',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010005',
            subjectLabel: 'Subject label of run 10010005',
            correlationId: 'correlation-id-10010005',
            statusName: 'failed',
            engine: {
              label: null,
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 0,
              inputTokenCount: 0,
              outputTokenCount: 0,
            },
            result: null,
            failure: {
              reasonCode: 'MEDIA_UNREADABLE',
              parameters: null,
            },
          },
        },
        {
          input: {
            runKey: 'run-key-10010010',
            apiClientId: 10000003,
            expandsSteps: false,
          },
          expected: {
            runKey: 'run-key-10010010',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010010',
            subjectLabel: 'Subject label of run 10010010',
            correlationId: 'correlation-id-10010010',
            statusName: 'canceled',
            engine: {
              label: null,
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 1,
              inputTokenCount: 1508,
              outputTokenCount: 188,
            },
            result: null,
            failure: null,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildAiRunResponse(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The fifth criterion read on the whole body: the trace is there when it was asked for, and
     * the same request without it carries no `steps` key at all — which the case above pins by
     * comparing the whole object.
     */
    describe('when the trace was asked for as well', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010006',
            apiClientId: 10000001,
            expandsSteps: true,
          },
          expected: {
            runKey: 'run-key-10010006',
            runCategoryName: 'asset-media-extraction',
            externalRef: 'external-ref-10010006',
            subjectLabel: 'Subject label of run 10010006',
            correlationId: 'correlation-id-10010006',
            statusName: 'canceled',
            engine: {
              label: null,
              confidenceMethodVersion: null,
            },
            usage: {
              modelCallCount: 2,
              inputTokenCount: 5413,
              outputTokenCount: 343,
            },
            result: null,
            failure: null,
            steps: [
              {
                stepIndex: 1,
                stepName: 'filter-suggestible-fields',
                stepCategoryName: 'code',
                outcomeCode: 'fields-kept',
                reasonCode: null,
                startedAt: new Date('2026-09-12T05:05:01.001Z'),
                finishedAt: new Date('2026-09-12T05:05:01.501Z'),
              },
              {
                stepIndex: 2,
                stepName: 'fetch-media',
                stepCategoryName: 'code',
                outcomeCode: 'step-canceled',
                reasonCode: 'canceled-before-completion',
                startedAt: new Date('2026-09-12T05:05:02.002Z'),
                finishedAt: new Date('2026-09-12T05:05:03.902Z'),
              },
            ],
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
        expected,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildAiRunResponse(input)

        expect(actual)
          .toEqual(expected)
      })
    })

    /*
     * The ninth criterion on the whole body: a run of another client answers as though it did not
     * exist, and is indistinguishable from a key nothing carries.
     */
    describe('when the client owns no run under that key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010004',
            apiClientId: 10000002,
            expandsSteps: false,
          },
        },
        {
          input: {
            runKey: 'run-key-10010003',
            apiClientId: 10000001,
            expandsSteps: true,
          },
        },
        {
          input: {
            runKey: 'run-key-that-no-run-carries',
            apiClientId: 10000001,
            expandsSteps: false,
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', async ({
        input,
      }) => {
        const builder = AiRunResponseBuilder.create()

        const actual = await builder.buildAiRunResponse(input)

        expect(actual)
          .toBeNull()
      })
    })
  })
})
