import AbortedAiCallCapsule from '../../../../app/tools/AbortedAiCallCapsule.js'

/*
 * What a driver answers when it refused a call because the run had already been told to stop.
 *
 * **Every member is exercised against more than one instance**, even the five that answer a fixed
 * value. A capsule that read its stored message where it should answer zero, or that answered the
 * message of the capsule before it, would pass a single case and fail here.
 *
 * Nothing in this file reaches a vendor, because nothing in this class can: it is the answer built
 * in place of a call, and it holds one string.
 */

describe('AbortedAiCallCapsule', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#refusalMessage', () => {
        const cases = [
          {
            tally: 'refusal-message-0001',
          },
          {
            tally: 'refusal-message-0002',
          },
        ]

        test.each(cases)('refusalMessage: $tally', ({
          tally,
        }) => {
          const capsule = new AbortedAiCallCapsule({
            refusalMessage: tally,
          })

          expect(capsule)
            .toHaveProperty('refusalMessage', tally)
        })
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0011',
          },
        },
        {
          input: {
            refusalMessage: 'refusal-message-0012',
          },
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
      }) => {
        const received = AbortedAiCallCapsule.create(input)

        expect(received)
          .toBeInstanceOf(AbortedAiCallCapsule)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0021',
          },
          expected: {
            refusalMessage: 'refusal-message-0021',
          },
        },
        {
          input: {
            refusalMessage: 'refusal-message-0022',
          },
          expected: {
            refusalMessage: 'refusal-message-0022',
          },
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AbortedAiCallCapsule)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill default refusalMessage', () => {
      test('when the caller states none', () => {
        const expected = {
          refusalMessage: 'refused a call whose run had already been told to stop',
        }

        const SpyClass = globalThis.constructorSpy.spyOn(AbortedAiCallCapsule)

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#hasError()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0031',
          },
        },
        {
          input: {
            refusalMessage: 'refusal-message-0032',
          },
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.hasError()

        expect(received)
          .toBeTruthy()
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#extractContentText()', () => {
    describe('should answer no text at all', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0041',
          },
          expected: '',
        },
        {
          input: {
            refusalMessage: 'refusal-message-0042',
          },
          expected: '',
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
        expected,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.extractContentText()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#extractFunctionCalls()', () => {
    describe('should answer no calls at all', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0051',
          },
        },
        {
          input: {
            refusalMessage: 'refusal-message-0052',
          },
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.extractFunctionCalls()

        expect(received)
          .toHaveLength(0)
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#extractErrorMessage()', () => {
    describe('should answer the refusal it was built with', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0071',
          },
          expected: 'refusal-message-0071',
        },
        {
          input: {
            refusalMessage: 'refusal-message-0072',
          },
          expected: 'refusal-message-0072',
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
        expected,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.extractErrorMessage()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#extractInputTokenCount()', () => {
    /*
     * Zero because the request never left this machine. A call that did leave and was abandoned in
     * flight is a different capsule — the vendor's own — and is likewise recorded at zero, against
     * a charge the vendor really made.
     */
    describe('should answer that nothing was spent', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0081',
          },
          expected: 0,
        },
        {
          input: {
            refusalMessage: 'refusal-message-0082',
          },
          expected: 0,
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
        expected,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.extractInputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AbortedAiCallCapsule', () => {
  describe('#extractOutputTokenCount()', () => {
    describe('should answer that nothing was spent', () => {
      const cases = [
        {
          input: {
            refusalMessage: 'refusal-message-0091',
          },
          expected: 0,
        },
        {
          input: {
            refusalMessage: 'refusal-message-0092',
          },
          expected: 0,
        },
      ]

      test.each(cases)('refusalMessage: $input.refusalMessage', ({
        input,
        expected,
      }) => {
        const capsule = AbortedAiCallCapsule.create(input)

        const received = capsule.extractOutputTokenCount()

        expect(received)
          .toBe(expected)
      })
    })
  })
})
