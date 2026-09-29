import AiRunOperatorCommandInputAdapter from '../../../../app/operatorCommand/AiRunOperatorCommandInputAdapter.js'

/*
 * The reading of the operator command's arguments, judged on what it does *not* do.
 *
 * Almost every case below is a value this class hands on although it is plainly wrong — a word
 * where a count belongs, an argument that names no instant, an argument nobody gave. Each of those
 * is refused one layer on, by `AiRunOperatorCommandInputValidator`, and a case here asserting the
 * refusal would be asserting the wrong class's job.
 */

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#argumentTexts', () => {
        const cases = [
          {
            input: {
              argumentTexts: [
                'stalled',
                '300',
              ],
            },
          },
          {
            input: {
              argumentTexts: [
                'run',
                'run-key-10900001',
              ],
            },
          },
        ]

        test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', ({
          input,
        }) => {
          const adapter = new AiRunOperatorCommandInputAdapter(input)

          expect(adapter)
            .toHaveProperty('argumentTexts', input.argumentTexts)
        })
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-09-28T00:00:00.000Z',
            ],
          },
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900001',
            ],
          },
        },
      ]

      test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.create(input)

        expect(received)
          .toBeInstanceOf(AiRunOperatorCommandInputAdapter)
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '60',
            ],
          },
        },
        {
          input: {
            argumentTexts: [],
          },
        },
      ]

      test.each(cases)('argumentTexts: $input.argumentTexts', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunOperatorCommandInputAdapter)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('.extractArgumentText()', () => {
    describe('with a position the operator filled', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
            index: 0,
          },
          expected: 'stalled',
        },
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
            index: 1,
          },
          expected: '300',
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900002',
            ],
            index: 1,
          },
          expected: 'correlation-id-10900002',
        },
      ]

      test.each(cases)('index: $input.index, argumentTexts[0]: $input.argumentTexts.0', ({
        input,
        expected,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.extractArgumentText(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with a position the operator left empty', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
            ],
            index: 1,
          },
        },
        {
          input: {
            argumentTexts: [],
            index: 0,
          },
        },
      ]

      test.each(cases)('index: $input.index, argumentTexts: $input.argumentTexts', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.extractArgumentText(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('.generateCount()', () => {
    describe('with an argument the operator gave', () => {
      const cases = [
        {
          input: {
            value: '300',
          },
          expected: 300,
        },
        {
          input: {
            value: '0',
          },
          expected: 0,
        },
        {
          input: {
            value: '-1',
          },
          expected: -1,
        },
        {
          input: {
            value: '1.5',
          },
          expected: 1.5,
        },
        {
          input: {
            value: 'three-hundred',
          },
          expected: Number.NaN,
        },
        {
          input: {
            value: '',
          },
          expected: 0,
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.generateCount(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with no argument at all', () => {
      const cases = [
        {
          input: {
            value: null,
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.generateCount(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('.generateInstant()', () => {
    describe('with an argument a calendar can read', () => {
      const cases = [
        {
          input: {
            value: '2026-09-28T00:00:00.000Z',
          },
          expected: new Date('2026-09-28T00:00:00.000Z'),
        },
        {
          input: {
            value: '2024-02-29T12:34:56.789Z',
          },
          expected: new Date('2024-02-29T12:34:56.789Z'),
        },
        {
          input: {
            value: '2026-01-31',
          },
          expected: new Date('2026-01-31T00:00:00.000Z'),
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.generateInstant(input)

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with an argument no calendar can read', () => {
      const cases = [
        {
          input: {
            value: 'yesterday',
          },
        },
        {
          input: {
            value: '2026-13-40T99:99:99.999Z',
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.generateInstant(input)

        expect(received)
          .toBeInstanceOf(Date)
      })
    })

    describe('with no argument at all', () => {
      const cases = [
        {
          input: {
            value: null,
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunOperatorCommandInputAdapter.generateInstant(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          argumentTexts: [
            'stalled',
            '300',
          ],
        },
      },
      {
        input: {
          argumentTexts: [
            'run',
            'run-key-10900003',
          ],
        },
      },
    ]

    test.each(cases)('argumentTexts[0]: $input.argumentTexts.0', ({
      input,
    }) => {
      const adapter = AiRunOperatorCommandInputAdapter.create(input)

      const received = adapter.Ctor

      expect(received)
        .toBe(AiRunOperatorCommandInputAdapter) // same reference
    })
  })
})

describe('AiRunOperatorCommandInputAdapter', () => {
  describe('#buildInput()', () => {
    describe('with a parameter the command reads as a count', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
              '300',
            ],
          },
          expected: {
            commandName: 'stalled',
            parameterText: '300',
            stalledForSeconds: 300,
            failedSince: expect.any(Date),
          },
        },
        {
          input: {
            argumentTexts: [
              'stalled',
              'three-hundred',
            ],
          },
          expected: {
            commandName: 'stalled',
            parameterText: 'three-hundred',
            stalledForSeconds: Number.NaN,
            failedSince: expect.any(Date),
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', ({
        input,
        expected,
      }) => {
        const adapter = AiRunOperatorCommandInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with a parameter the command reads as an instant', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-09-28T00:00:00.000Z',
            ],
          },
          expected: {
            commandName: 'failed-since',
            parameterText: '2026-09-28T00:00:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2026-09-28T00:00:00.000Z'),
          },
        },
        {
          input: {
            argumentTexts: [
              'failed-since',
              '2026-01-31T09:15:00.000Z',
            ],
          },
          expected: {
            commandName: 'failed-since',
            parameterText: '2026-01-31T09:15:00.000Z',
            stalledForSeconds: Number.NaN,
            failedSince: new Date('2026-01-31T09:15:00.000Z'),
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', ({
        input,
        expected,
      }) => {
        const adapter = AiRunOperatorCommandInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with a parameter the command reads as text', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'run',
              'run-key-10900001',
            ],
          },
          expected: {
            commandName: 'run',
            parameterText: 'run-key-10900001',
            stalledForSeconds: Number.NaN,
            failedSince: expect.any(Date),
          },
        },
        {
          input: {
            argumentTexts: [
              'correlation',
              'correlation-id-10900002',
            ],
          },
          expected: {
            commandName: 'correlation',
            parameterText: 'correlation-id-10900002',
            stalledForSeconds: Number.NaN,
            failedSince: expect.any(Date),
          },
        },
      ]

      test.each(cases)('argumentTexts[1]: $input.argumentTexts.1', ({
        input,
        expected,
      }) => {
        const adapter = AiRunOperatorCommandInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('with arguments the operator did not give', () => {
      const cases = [
        {
          input: {
            argumentTexts: [
              'stalled',
            ],
          },
          expected: {
            commandName: 'stalled',
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
        {
          input: {
            argumentTexts: [],
          },
          expected: {
            commandName: null,
            parameterText: null,
            stalledForSeconds: null,
            failedSince: null,
          },
        },
      ]

      test.each(cases)('argumentTexts: $input.argumentTexts', ({
        input,
        expected,
      }) => {
        const adapter = AiRunOperatorCommandInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
