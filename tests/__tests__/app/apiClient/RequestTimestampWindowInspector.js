import RequestTimestampWindowInspector from '../../../../app/apiClient/RequestTimestampWindowInspector.js'

describe('RequestTimestampWindowInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#allowedDeviationSeconds', () => {
        const cases = [
          {
            tally: 300,
          },
          {
            tally: 60,
          },
          {
            tally: 0,
          },
        ]

        test.each(cases)('allowedDeviationSeconds: $tally', ({
          tally,
        }) => {
          const inspector = new RequestTimestampWindowInspector({
            allowedDeviationSeconds: tally,
          })

          expect(inspector)
            .toHaveProperty('allowedDeviationSeconds', tally)
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            allowedDeviationSeconds: 120,
          },
        },
        {
          input: {
            allowedDeviationSeconds: 900,
          },
        },
      ]

      test.each(cases)('allowedDeviationSeconds: $input.allowedDeviationSeconds', ({
        input,
      }) => {
        const received = RequestTimestampWindowInspector.create(input)

        expect(received)
          .toBeInstanceOf(RequestTimestampWindowInspector)
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            allowedDeviationSeconds: 30,
          },
        },
        {
          tally: {
            allowedDeviationSeconds: 600,
          },
        },
      ]

      test.each(cases)('allowedDeviationSeconds: $tally.allowedDeviationSeconds', ({
        tally,
      }) => {
        const SpyClass = constructorSpy.spyOn(RequestTimestampWindowInspector)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('.create()', () => {
    describe('should fill default allowedDeviationSeconds', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(RequestTimestampWindowInspector)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith({
            allowedDeviationSeconds: 300, // the tolerance the client API contract states
          })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isAcceptableTimestamp()', () => {
    /*
     * The server's clock stands at 2026-09-23T10:00:00.000Z, which is epoch second 1790157600, and
     * the default window is the 300 seconds the contract states. Both edges belong to the window,
     * and the window is applied in either direction.
     */
    describe('should be truthy', () => {
      describe('when the timestamp sits inside the window', () => {
        const cases = [
          {
            input: {
              timestampHeaderValue: '1790157600', // the server's own second
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790157300', // 300 seconds behind, the far edge
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790157900', // 300 seconds ahead, the far edge
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790157599', // one second behind
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const inspector = RequestTimestampWindowInspector.create()

          const received = inspector.isAcceptableTimestamp(input)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isAcceptableTimestamp()', () => {
    describe('should be falsy', () => {
      describe('when the timestamp sits past the window', () => {
        const cases = [
          {
            input: {
              timestampHeaderValue: '1790157299', // 301 seconds behind, one past the edge
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790157901', // 301 seconds ahead, one past the edge
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790071200', // a day behind
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790244000', // a day ahead
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const inspector = RequestTimestampWindowInspector.create()

          const received = inspector.isAcceptableTimestamp(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isAcceptableTimestamp()', () => {
    /*
     * Each of these carries no epoch seconds the window could be applied to, and each is reported
     * the same way a timestamp too far out is — the refusal, and the status carrying it, belong to
     * the caller. The server's clock stands at the second every one of them all but states, so a
     * case that came out truthy would be one this class read loosely rather than refused.
     */
    describe('should be falsy', () => {
      describe('when the timestamp is not a run of digits', () => {
        /** @type {Array<{ input: { timestampHeaderValue: *, now: Date } }>} */
        const cases = /** @type {Array<*>} */ ([
          {
            input: {
              timestampHeaderValue: '1790157600 ', // a trailing space
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: ' 1790157600', // a leading space
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '+1790157600', // a leading sign
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '-1790157600',
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1790157600.5', // fractional seconds
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '1.7901576e9', // scientific notation
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: '', // a header declared with no value
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: 'the-time-it-is', // not a number at all
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: undefined, // a header nobody sent
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: null,
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: 1790157600, // the seconds as a number, not as the text sent
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              timestampHeaderValue: [ // what a header sent twice arrives as
                '1790157600',
                '1790157600',
              ],
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ])

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const inspector = RequestTimestampWindowInspector.create()

          const received = inspector.isAcceptableTimestamp(input)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isAcceptableTimestamp()', () => {
    /*
     * The instant arrives on the call, so one request has one instant. Each case names a clock years
     * away from the one this test runs under, and a timestamp standing at that clock's own second:
     * a class reading the real clock instead would refuse both.
     */
    describe('should judge against the instant it was handed', () => {
      const cases = [
        {
          input: {
            timestampHeaderValue: '1936513200',
            now: new Date('2031-05-14T08:20:00.000Z'),
          },
        },
        {
          input: {
            timestampHeaderValue: '1614714300',
            now: new Date('2021-03-02T19:45:00.000Z'),
          },
        },
      ]

      test.each(cases)('now: $input.now', ({
        input,
      }) => {
        const inspector = RequestTimestampWindowInspector.create()
        const dateNowSpy = jest.spyOn(Date, 'now')

        const received = inspector.isAcceptableTimestamp(input)

        expect(received)
          .toBeTruthy()
        expect(dateNowSpy)
          .not
          .toHaveBeenCalled()
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isAcceptableTimestamp()', () => {
    /*
     * A deployment narrows or widens its tolerance for clock skew in `create()`, and the comparison
     * is never edited to say a different number. 1790157300 is 300 seconds from the server's clock:
     * inside the contract's window, outside a narrowed one.
     */
    describe('when the window is narrowed', () => {
      describe('should be falsy', () => {
        const cases = [
          {
            input: {
              allowedDeviationSeconds: 60,
              timestampHeaderValue: '1790157300', // 300 seconds behind
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              allowedDeviationSeconds: 60,
              timestampHeaderValue: '1790157661', // 61 seconds ahead
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
          {
            input: {
              allowedDeviationSeconds: 0,
              timestampHeaderValue: '1790157601', // one second ahead of a window of none
              now: new Date('2026-09-23T10:00:00.000Z'),
            },
          },
        ]

        test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
          input,
        }) => {
          const createArgs = {
            allowedDeviationSeconds: input.allowedDeviationSeconds,
          }
          const isAcceptableTimestampArgs = {
            timestampHeaderValue: input.timestampHeaderValue,
            now: input.now,
          }

          const inspector = RequestTimestampWindowInspector.create(createArgs)

          const received = inspector.isAcceptableTimestamp(isAcceptableTimestampArgs)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#extractTimestampSeconds()', () => {
    describe('when the header carries a run of digits', () => {
      const cases = [
        {
          input: {
            timestampHeaderValue: '1790157600',
          },
          expected: 1790157600,
        },
        {
          input: {
            timestampHeaderValue: '0', // the epoch itself
          },
          expected: 0,
        },
        {
          input: {
            timestampHeaderValue: '007', // leading zeros are still a run of digits
          },
          expected: 7,
        },
        {
          input: {
            timestampHeaderValue: '9007199254740991', // Number.MAX_SAFE_INTEGER
          },
          expected: 9007199254740991, // Number.MAX_SAFE_INTEGER
        },
      ]

      test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
        input,
        expected,
      }) => {
        const inspector = RequestTimestampWindowInspector.create()

        const received = inspector.extractTimestampSeconds(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#extractTimestampSeconds()', () => {
    describe('when the header carries no epoch seconds', () => {
      /** @type {Array<{ input: { timestampHeaderValue: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          input: {
            timestampHeaderValue: '1790157600 ', // a trailing space
          },
        },
        {
          input: {
            timestampHeaderValue: ' 1790157600', // a leading space
          },
        },
        {
          input: {
            timestampHeaderValue: '+1790157600', // a leading sign
          },
        },
        {
          input: {
            timestampHeaderValue: '-1790157600',
          },
        },
        {
          input: {
            timestampHeaderValue: '1790157600.5', // fractional seconds
          },
        },
        {
          input: {
            timestampHeaderValue: '1.7901576e9', // scientific notation
          },
        },
        {
          input: {
            timestampHeaderValue: '0x6AA1B4E0', // hexadecimal
          },
        },
        {
          input: {
            timestampHeaderValue: '', // a header declared with no value
          },
        },
        {
          input: {
            timestampHeaderValue: 'the-time-it-is', // not a number at all
          },
        },
        {
          input: {
            timestampHeaderValue: undefined, // a header nobody sent
          },
        },
        {
          input: {
            timestampHeaderValue: null,
          },
        },
        {
          input: {
            timestampHeaderValue: 1790157600, // the seconds as a number, not as the text sent
          },
        },
        {
          input: {
            timestampHeaderValue: [ // what a header sent twice arrives as
              '1790157600',
              '1790157601',
            ],
          },
        },
      ])

      test.each(cases)('timestampHeaderValue: $input.timestampHeaderValue', ({
        input,
      }) => {
        const inspector = RequestTimestampWindowInspector.create()

        const received = inspector.extractTimestampSeconds(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isWithinAllowedWindow()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            allowedDeviationSeconds: 300,
          },
          timestampSecondsCases: [
            {
              timestampSeconds: 1790157600, // the server's own second
            },
            {
              timestampSeconds: 1790157300, // 300 seconds behind, the far edge
            },
            {
              timestampSeconds: 1790157900, // 300 seconds ahead, the far edge
            },
          ],
        },
        {
          input: {
            allowedDeviationSeconds: 60,
          },
          timestampSecondsCases: [
            {
              timestampSeconds: 1790157599, // one second behind
            },
            {
              timestampSeconds: 1790157540, // 60 seconds behind, the far edge
            },
            {
              timestampSeconds: 1790157660, // 60 seconds ahead, the far edge
            },
          ],
        },
      ]

      describe.each(cases)('allowedDeviationSeconds: $input.allowedDeviationSeconds', ({
        input,
        timestampSecondsCases,
      }) => {
        const inspector = RequestTimestampWindowInspector.create(input)

        test.each(timestampSecondsCases)('timestampSeconds: $timestampSeconds', ({
          timestampSeconds,
        }) => {
          const args = {
            timestampSeconds,
            now: new Date('2026-09-23T10:00:00.000Z'),
          }

          const received = inspector.isWithinAllowedWindow(args)

          expect(received)
            .toBeTruthy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#isWithinAllowedWindow()', () => {
    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            allowedDeviationSeconds: 300,
          },
          timestampSecondsCases: [
            {
              timestampSeconds: 1790157299, // 301 seconds behind, one past the edge
            },
            {
              timestampSeconds: 1790157901, // 301 seconds ahead, one past the edge
            },
            {
              timestampSeconds: 1790071200, // a day behind
            },
          ],
        },
        {
          input: {
            allowedDeviationSeconds: 60,
          },
          timestampSecondsCases: [
            {
              timestampSeconds: 1790157539, // 61 seconds behind, one past the edge
            },
            {
              timestampSeconds: 1790157661, // 61 seconds ahead, one past the edge
            },
            {
              timestampSeconds: 1790157300, // 300 seconds behind — inside the contract's window
            },
          ],
        },
      ]

      describe.each(cases)('allowedDeviationSeconds: $input.allowedDeviationSeconds', ({
        input,
        timestampSecondsCases,
      }) => {
        const inspector = RequestTimestampWindowInspector.create(input)

        test.each(timestampSecondsCases)('timestampSeconds: $timestampSeconds', ({
          timestampSeconds,
        }) => {
          const args = {
            timestampSeconds,
            now: new Date('2026-09-23T10:00:00.000Z'),
          }

          const received = inspector.isWithinAllowedWindow(args)

          expect(received)
            .toBeFalsy()
        })
      })
    })
  })
})

describe('RequestTimestampWindowInspector', () => {
  describe('#generateDeviationSeconds()', () => {
    /*
     * The count never goes below zero, so one side of the clock is measured the same as the other.
     * The allowed deviation is the axis it must not depend on — the same distances are asked of a
     * wide instance and a narrow one, and both answer the same.
     */
    describe('should count the distance in either direction alike', () => {
      const cases = [
        {
          input: {
            allowedDeviationSeconds: 300,
          },
        },
        {
          input: {
            allowedDeviationSeconds: 60,
          },
        },
      ]

      describe.each(cases)('allowedDeviationSeconds: $input.allowedDeviationSeconds', ({
        input,
      }) => {
        const inspector = RequestTimestampWindowInspector.create(input)

        const timestampSecondsCases = [
          {
            timestampSeconds: 1790157600, // the server's own second
            expected: 0,
          },
          {
            timestampSeconds: 1790157599, // one second behind
            expected: 1,
          },
          {
            timestampSeconds: 1790157300, // 300 seconds behind
            expected: 300,
          },
          {
            timestampSeconds: 1790157901, // 301 seconds ahead
            expected: 301,
          },
          {
            timestampSeconds: 1790071200, // a day behind
            expected: 86400,
          },
        ]

        test.each(timestampSecondsCases)('timestampSeconds: $timestampSeconds', ({
          timestampSeconds,
          expected,
        }) => {
          const args = {
            timestampSeconds,
            now: new Date('2026-09-23T10:00:00.000Z'),
          }

          const received = inspector.generateDeviationSeconds(args)

          expect(received)
            .toBe(expected)
        })
      })
    })
  })
})
