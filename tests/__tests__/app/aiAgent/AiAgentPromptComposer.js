import AiAgentPromptComposer from '../../../../app/aiAgent/AiAgentPromptComposer.js'

import AI_AGENT_CONSTANT_HASH from '../../../../app/constants/aiAgentConstants.js'

import AiAgentAvailableAiTool from '../../../../sequelize/models/AiAgentAvailableAiTool.js'
import AiAgentDefaultInstruction from '../../../../sequelize/models/AiAgentDefaultInstruction.js'
import AiAgentRoleInstruction from '../../../../sequelize/models/AiAgentRoleInstruction.js'
import AiTool from '../../../../sequelize/models/AiTool.js'

const {
  AI_AGENT,
} = AI_AGENT_CONSTANT_HASH

describe('AiAgentPromptComposer', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiAgentId', () => {
        const cases = [
          {
            tally: 10020001,
          },
          {
            tally: 10020003,
          },
          {
            tally: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        ]

        test.each(cases)('aiAgentId: $tally', ({
          tally,
        }) => {
          const composer = new AiAgentPromptComposer({
            aiAgentId: tally,
          })

          expect(composer)
            .toHaveProperty('aiAgentId', tally)
        })
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
        },
        {
          input: {
            aiAgentId: 10020002,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', ({
        input,
      }) => {
        const received = AiAgentPromptComposer.create(input)

        expect(received)
          .toBeInstanceOf(AiAgentPromptComposer)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            aiAgentId: 10020003,
          },
        },
        {
          tally: {
            aiAgentId: 10020005,
          },
        },
      ]

      test.each(cases)('aiAgentId: $tally.aiAgentId', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiAgentPromptComposer)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.get:AiAgentDefaultInstructionCtor', () => {
    describe('when called as is', () => {
      test('should be the agent instruction model', () => {
        const received = AiAgentPromptComposer.AiAgentDefaultInstructionCtor

        expect(received)
          .toBe(AiAgentDefaultInstruction) // same reference
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.get:AiAgentRoleInstructionCtor', () => {
    describe('when called as is', () => {
      test('should be the agent system-prompt model', () => {
        const received = AiAgentPromptComposer.AiAgentRoleInstructionCtor

        expect(received)
          .toBe(AiAgentRoleInstruction) // same reference
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.get:AiAgentAvailableAiToolCtor', () => {
    describe('when called as is', () => {
      test('should be the agent-to-tool binding model', () => {
        const received = AiAgentPromptComposer.AiAgentAvailableAiToolCtor

        expect(received)
          .toBe(AiAgentAvailableAiTool) // same reference
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('.get:AiToolCtor', () => {
    describe('when called as is', () => {
      test('should be the tool schema model', () => {
        const received = AiAgentPromptComposer.AiToolCtor

        expect(received)
          .toBe(AiTool) // same reference
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        tally: AiAgentPromptComposer,
      },
      {
        tally: class AlphaAiAgentPromptComposer extends AiAgentPromptComposer {},
      },
      {
        tally: class BetaAiAgentPromptComposer extends AiAgentPromptComposer {},
      },
    ]

    test.each(cases)('Ctor: $tally.name', ({
      tally,
    }) => {
      const composer = tally.create({
        aiAgentId: 10020001, // neutral value; the class is what is under test
      })

      const received = composer.Ctor

      expect(received)
        .toBe(tally) // same reference
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#composePrompt()', () => {
    /*
     * The whole composition of a fixture agent is stated as a literal, wrapper included, so a
     * change to the wrapper, to the order the tools come back in, or to which row a field is read
     * from, all show up here. Nothing is assembled by the test: the expected instruction is written
     * out rather than built from the instruction text, because a test that wrapped the text itself
     * would agree with a composer that wrapped it wrongly in the same way.
     */
    describe('should compose the prompt the rows describe', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
          expected: {
            instruction: '<instruction><agent_preset>Fixture instruction of the alpha agent.</agent_preset></instruction>',
            role: 'Fixture role of the alpha agent.',
            toolSchemas: [
              // displayed first, and hidden from an operator — hidden is still sent
              {
                name: 'hidden_fixture_tool',
                description: 'Reports the hidden value the fixture asks for.',
                input_schema: {
                  type: 'object',
                  properties: {
                    hiddenValue: {
                      type: 'string',
                    },
                  },
                  required: [
                    'hiddenValue',
                  ],
                },
              },
              // displayed second, though its binding was written first
              {
                name: 'visible_fixture_tool',
                description: 'Reports the visible value the fixture asks for.',
                input_schema: {
                  type: 'object',
                  properties: {
                    visibleValue: {
                      type: 'string',
                    },
                  },
                  required: [
                    'visibleValue',
                  ],
                },
              },
              // the third bound tool is switched off, and so is absent
            ],
            instructionSavedAt: new Date('2026-09-11T03:03:03.003Z'),
          },
        },
        {
          input: {
            aiAgentId: 10020003,
          },
          expected: {
            instruction: '<instruction><agent_preset>Fixture instruction of the gamma agent.</agent_preset></instruction>',
            role: 'Fixture role of the gamma agent.',
            toolSchemas: [
              // the tool the other agent has switched off, switched on for this one
              {
                name: 'shared_fixture_tool',
                description: 'Reports the shared value the fixture asks for.',
                input_schema: {
                  type: 'object',
                  properties: {
                    sharedValue: {
                      type: 'string',
                    },
                  },
                  required: [
                    'sharedValue',
                  ],
                },
              },
            ],
            instructionSavedAt: new Date('2026-09-11T05:05:05.005Z'),
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.composePrompt()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#composePrompt()', () => {
    /*
     * The one agent a production install is seeded with. Its role and the instant its instruction
     * was saved under are stated here rather than read back from the row, because those two values
     * are what the criterion is about: the text a service sends comes from the database, and the
     * version a model call records addresses exactly one generation of it.
     *
     * The instant is written out as a literal. Reading it from the row it is supposed to identify
     * would assert nothing — the composer could report any instant at all and still agree.
     *
     * One case, because the production master seeds exactly one agent; the fixture agents above
     * carry the variation.
     */
    describe('should carry what the seeded service agent holds', () => {
      const cases = [
        {
          input: {
            aiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          expected: expect.objectContaining({
            role: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
            toolSchemas: [
              // no tool is bound to the service agent this version
            ],
            instructionSavedAt: new Date('2026-09-24T00:00:03.003Z'),
          }),
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.composePrompt()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#composePrompt()', () => {
    /*
     * The seeded baseline instruction is long and is expected to be reworded, so the composed
     * instruction is checked for carrying it rather than for equalling a copy of it. The text is
     * read from the same constant the seeder read, which is why rewording the baseline needs no
     * edit here — and the wrapper around it is pinned by `#generateComposedInstruction()` below.
     */
    describe('should carry the seeded instruction inside the composed instruction', () => {
      const cases = [
        {
          input: {
            aiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          expected: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const composedPrompt = await composer.composePrompt()
        const received = composedPrompt.instruction

        expect(received)
          .toContain(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#composePrompt()', () => {
    /*
     * Every way the composition can fail answers null, and none of them substitutes wording from
     * code. The four cases are the four ways: the instruction row is absent, the role row is
     * absent, a bound tool's payload is not the JSON it claims to be, and the agent is not there at
     * all.
     */
    describe('should be null', () => {
      const cases = [
        {
          // an agent row with neither an instruction nor a role beneath it
          input: {
            aiAgentId: 10020004,
          },
        },
        {
          // an agent row with an instruction and no role
          input: {
            aiAgentId: 10020005,
          },
        },
        {
          // a bound tool whose payload cannot be read
          input: {
            aiAgentId: 10020002,
          },
        },
        {
          // no agent of this id was ever seeded
          input: {
            aiAgentId: 19999999,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.composePrompt()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findDefaultInstruction()', () => {
    describe('should find the instruction of the agent it was given', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
          expected: 'Fixture instruction of the alpha agent.',
        },
        {
          input: {
            aiAgentId: 10020003,
          },
          expected: 'Fixture instruction of the gamma agent.',
        },
        {
          input: {
            aiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          expected: AI_AGENT.ASSET_MEDIA_EXTRACTION.DEFAULT_INSTRUCTION,
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const defaultInstruction = await composer.findDefaultInstruction()
        const received = defaultInstruction.instruction

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findDefaultInstruction()', () => {
    describe('should be null', () => {
      const cases = [
        {
          // an agent row with no instruction beneath it
          input: {
            aiAgentId: 10020004,
          },
        },
        {
          // no agent of this id was ever seeded
          input: {
            aiAgentId: 19999998,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.findDefaultInstruction()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findRoleInstruction()', () => {
    describe('should find the role of the agent it was given', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
          expected: 'Fixture role of the alpha agent.',
        },
        {
          input: {
            aiAgentId: 10020003,
          },
          expected: 'Fixture role of the gamma agent.',
        },
        {
          input: {
            aiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
          expected: AI_AGENT.ASSET_MEDIA_EXTRACTION.ROLE_INSTRUCTION,
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const roleInstruction = await composer.findRoleInstruction()
        const received = roleInstruction.role

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findRoleInstruction()', () => {
    describe('should be null', () => {
      const cases = [
        {
          // an agent row with an instruction and no role
          input: {
            aiAgentId: 10020005,
          },
        },
        {
          // no agent of this id was ever seeded
          input: {
            aiAgentId: 19999997,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.findRoleInstruction()

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findAvailableAiTools()', () => {
    /*
     * The expected array is exact, so it states three things at once: which bindings come back,
     * that a binding switched off is not among them, and the order they arrive in. The alpha
     * agent's two enabled bindings are expected in the reverse of the order they were written in,
     * because the tools they bind are displayed in that reverse order.
     */
    describe('should find the enabled bindings in display order', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
          expected: [
            expect.objectContaining({
              id: 10080002,
              AiToolId: 10070002,
            }),
            expect.objectContaining({
              id: 10080001,
              AiToolId: 10070001,
            }),
          ],
        },
        {
          input: {
            aiAgentId: 10020003,
          },
          expected: [
            expect.objectContaining({
              id: 10080005,
              AiToolId: 10070004,
            }),
          ],
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.findAvailableAiTools()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#findAvailableAiTools()', () => {
    describe('should be empty', () => {
      const cases = [
        {
          // the service agent has no tool bound to it this version
          input: {
            aiAgentId: AI_AGENT.ASSET_MEDIA_EXTRACTION.ID,
          },
        },
        {
          // an agent with no binding of its own, though another agent has bindings
          input: {
            aiAgentId: 10020004,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
      }) => {
        const composer = AiAgentPromptComposer.create(input)

        const received = await composer.findAvailableAiTools()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#buildToolSchemas()', () => {
    /*
     * The bindings are loaded by the method that loads them rather than written out here, so the
     * schemas asserted are the ones parsed out of the rows an operator would edit.
     */
    describe('should build the schema of each bound tool', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020001,
          },
          expected: [
            {
              name: 'hidden_fixture_tool',
              description: 'Reports the hidden value the fixture asks for.',
              input_schema: {
                type: 'object',
                properties: {
                  hiddenValue: {
                    type: 'string',
                  },
                },
                required: [
                  'hiddenValue',
                ],
              },
            },
            {
              name: 'visible_fixture_tool',
              description: 'Reports the visible value the fixture asks for.',
              input_schema: {
                type: 'object',
                properties: {
                  visibleValue: {
                    type: 'string',
                  },
                },
                required: [
                  'visibleValue',
                ],
              },
            },
          ],
        },
        {
          input: {
            aiAgentId: 10020003,
          },
          expected: [
            {
              name: 'shared_fixture_tool',
              description: 'Reports the shared value the fixture asks for.',
              input_schema: {
                type: 'object',
                properties: {
                  sharedValue: {
                    type: 'string',
                  },
                },
                required: [
                  'sharedValue',
                ],
              },
            },
          ],
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create(input)
        const availableAiTools = await composer.findAvailableAiTools()
        const args = {
          availableAiTools,
        }

        const received = composer.buildToolSchemas(args)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#buildToolSchemas()', () => {
    /*
     * One case, because one seeded agent is bound to a tool whose payload cannot be read and one is
     * all the case needs: what is asserted is that the unreadable row takes the whole set with it
     * rather than being dropped out of a shorter one.
     */
    describe('should be null', () => {
      const cases = [
        {
          input: {
            aiAgentId: 10020002,
          },
        },
      ]

      test.each(cases)('aiAgentId: $input.aiAgentId', async ({
        input,
      }) => {
        const composer = AiAgentPromptComposer.create(input)
        const availableAiTools = await composer.findAvailableAiTools()
        const args = {
          availableAiTools,
        }

        const received = composer.buildToolSchemas(args)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#extractToolSchema()', () => {
    /*
     * The payload is the method's argument, not a row standing in for one: the path that reads a
     * row is `#findAvailableAiTools()`, and it runs against the seeds. What is under test here is
     * only what the text in that column is turned into.
     */
    describe('with valid values', () => {
      const cases = [
        {
          input: {
            aiTool: {
              payload: '{"name":"payload_fixture_tool_0001","input_schema":{"type":"object"}}',
            },
          },
          expected: {
            name: 'payload_fixture_tool_0001',
            input_schema: {
              type: 'object',
            },
          },
        },
        {
          input: {
            aiTool: {
              payload: '{"type":"web_search_20250305","name":"payload_fixture_tool_0002"}',
            },
          },
          expected: {
            type: 'web_search_20250305',
            name: 'payload_fixture_tool_0002',
          },
        },
      ]

      test.each(cases)('payload: $input.aiTool.payload', ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create({
          aiAgentId: 10020001, // neutral value; no row is read by this method
        })

        const received = composer.extractToolSchema(input)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#extractToolSchema()', () => {
    describe('with invalid values', () => {
      describe('should be null', () => {
        const cases = [
          {
            input: {
              aiTool: {
                payload: 'unreadable-fixture-payload-{',
              },
            },
          },
          {
            input: {
              aiTool: {
                payload: '',
              },
            },
          },
          {
            input: {
              aiTool: null,
            },
          },
        ]

        test.each(cases)('aiTool: $input.aiTool', ({
          input,
        }) => {
          const composer = AiAgentPromptComposer.create({
            aiAgentId: 10020001, // neutral value; no row is read by this method
          })

          const received = composer.extractToolSchema(input)

          expect(received)
            .toBeNull()
        })
      })
    })
  })
})

describe('AiAgentPromptComposer', () => {
  describe('#generateComposedInstruction()', () => {
    /*
     * The wrapper is pinned here, and nowhere else. It is the convention's agent-preset part, and
     * the cases show it names the part without touching the text: a multi-line instruction comes
     * back with its line break where it was, and an empty one comes back as an empty part rather
     * than as anything supplied from code.
     */
    describe('should wrap the instruction as the agent preset', () => {
      const cases = [
        {
          input: {
            defaultInstruction: 'Fixture instruction 0001.',
          },
          expected: '<instruction><agent_preset>Fixture instruction 0001.</agent_preset></instruction>',
        },
        {
          input: {
            defaultInstruction: 'Fixture instruction 0002.\nIts second line.',
          },
          expected: '<instruction><agent_preset>Fixture instruction 0002.\nIts second line.</agent_preset></instruction>',
        },
        {
          input: {
            defaultInstruction: '',
          },
          expected: '<instruction><agent_preset></agent_preset></instruction>',
        },
      ]

      test.each(cases)('defaultInstruction: $input.defaultInstruction', ({
        input,
        expected,
      }) => {
        const composer = AiAgentPromptComposer.create({
          aiAgentId: 10020003, // neutral value; no row is read by this method
        })

        const received = composer.generateComposedInstruction(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})
