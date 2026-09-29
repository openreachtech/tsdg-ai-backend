import AiRunsQueryInputAdapter from '../../../../../app/adapter/forRenderer/AiRunsQueryInputAdapter.js'

/*
 * The reading of section 13's query string, judged on what it does *not* do.
 *
 * Almost every case below is about a value this class hands on untouched although it is plainly
 * wrong — an array where one value belongs, a word where a count belongs, a page size of nothing.
 * Each of those is refused, and refused by `AiRunsQueryInputValidator`, one layer further on. A
 * case here asserting that this class refused it would be asserting the wrong class's job, and a
 * change that moved the refusal in here would break every rule the validator states.
 */

describe('AiRunsQueryInputAdapter', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#query', () => {
        const cases = [
          {
            input: {
              query: {
                statusName: 'queued',
              },
            },
          },
          {
            input: {
              query: {
                limit: '5',
              },
            },
          },
        ]

        test.each(cases)('query: $input.query', ({
          input,
        }) => {
          const adapter = new AiRunsQueryInputAdapter(input)

          expect(adapter)
            .toHaveProperty('query', input.query)
        })
      })
    })
  })
})

describe('AiRunsQueryInputAdapter', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            query: {
              statusName: 'running',
            },
          },
        },
        {
          input: {
            query: {
              cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
            },
          },
        },
      ]

      test.each(cases)('query: $input.query', ({
        input,
      }) => {
        const received = AiRunsQueryInputAdapter.create(input)

        expect(received)
          .toBeInstanceOf(AiRunsQueryInputAdapter)
      })
    })
  })
})

describe('AiRunsQueryInputAdapter', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            query: {
              statusName: 'failed',
            },
          },
        },
        {
          input: {
            query: {
              correlationId: 'correlation-id-0001',
            },
          },
        },
      ]

      test.each(cases)('query: $input.query', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunsQueryInputAdapter)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunsQueryInputAdapter', () => {
  describe('.generateCount()', () => {
    describe('with values a caller sent', () => {
      const cases = [
        {
          input: {
            value: '5',
          },
          expected: 5,
        },
        {
          input: {
            value: '100',
          },
          expected: 100,
        },
        {
          input: {
            value: '0',
          },
          expected: 0,
        },
        {
          input: {
            // a fraction survives as a fraction, and is refused by the validator rather than here
            value: '1.5',
          },
          expected: 1.5,
        },
        {
          input: {
            value: '-3',
          },
          expected: -3,
        },
        {
          input: {
            value: String(Number.MAX_SAFE_INTEGER),
          },
          expected: Number.MAX_SAFE_INTEGER,
        },
        {
          input: {
            // `?limit=` with nothing after it, which reads as zero and is refused by the validator
            value: '',
          },
          expected: 0,
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
        expected,
      }) => {
        const received = AiRunsQueryInputAdapter.generateCount(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with values that are no count', () => {
      const cases = [
        {
          input: {
            value: 'omega',
          },
        },
        {
          input: {
            // a repeated query parameter arrives as an array
            value: [
              '5',
              '10',
            ],
          },
        },
        {
          input: {
            value: 'ten',
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputAdapter.generateCount(input)

        expect(received)
          .toBeNaN()
      })
    })

    describe('with no value at all', () => {
      const cases = [
        {
          input: {
            value: null,
          },
        },
        {
          input: {
            // value: undefined
          },
        },
      ]

      test.each(cases)('value: $input.value', ({
        input,
      }) => {
        const received = AiRunsQueryInputAdapter.generateCount(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunsQueryInputAdapter', () => {
  describe('#buildInput()', () => {
    describe('should read every parameter the query carried', () => {
      const cases = [
        {
          input: {
            query: {
              statusName: 'running',
              runCategoryName: 'asset-media-extraction',
              correlationId: 'correlation-id-0001',
              stalledForSeconds: '300',
              limit: '50',
              cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
            },
          },
          expected: {
            statusName: 'running',
            runCategoryName: 'asset-media-extraction',
            correlationId: 'correlation-id-0001',
            stalledForSeconds: 300,
            limit: 50,
            cursor: 'cnVuLWtleS0xMDAxMDAwMQ',
          },
        },
        {
          input: {
            query: {
              statusName: 'succeeded',
              correlationId: 'correlation-id-0002',
              limit: '1',
            },
          },
          expected: {
            statusName: 'succeeded',
            runCategoryName: null,
            correlationId: 'correlation-id-0002',
            stalledForSeconds: null,
            limit: 1,
            cursor: null,
          },
        },
        {
          input: {
            query: {},
          },
          expected: {
            statusName: null,
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
        },
      ]

      test.each(cases)('statusName: $input.query.statusName', ({
        input,
        expected,
      }) => {
        const adapter = AiRunsQueryInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('should hand a repeated parameter on as it came', () => {
      const cases = [
        {
          input: {
            query: {
              statusName: [
                'queued',
                'running',
              ],
            },
          },
          expected: {
            statusName: [
              'queued',
              'running',
            ],
            runCategoryName: null,
            correlationId: null,
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
        },
        {
          input: {
            query: {
              correlationId: [
                'correlation-id-0003',
                'correlation-id-0004',
              ],
            },
          },
          expected: {
            statusName: null,
            runCategoryName: null,
            correlationId: [
              'correlation-id-0003',
              'correlation-id-0004',
            ],
            stalledForSeconds: null,
            limit: null,
            cursor: null,
          },
        },
      ]

      test.each(cases)('statusName: $input.query.statusName', ({
        input,
        expected,
      }) => {
        const adapter = AiRunsQueryInputAdapter.create(input)

        const received = adapter.buildInput()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})
