import AiRunPageCursor from '../../../../app/aiRun/AiRunPageCursor.js'

/*
 * The cursor of section 13's list, read as a pure value.
 *
 * Nothing here touches a table, because nothing about a cursor is stored: it is a run key and an
 * encoding of it. Whether the run a cursor names belongs to the caller is a different question,
 * answered by a read, and it is `AiRunPageResponseBuilder`'s own test file that answers it.
 *
 * **The invalid cases are what the round trip exists for.** Base64 decoding in Node throws on
 * nothing — it drops what it cannot read and answers with whatever is left — so every string in
 * `with invalid values` below decodes to *something*. What makes each of them a refusal is that
 * the something does not re-encode to the text it came from.
 */

describe('AiRunPageCursor', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#runKey', () => {
        const cases = [
          {
            input: {
              runKey: 'run-key-0001',
            },
          },
          {
            input: {
              runKey: 'run-key-0002',
            },
          },
        ]

        test.each(cases)('runKey: $input.runKey', ({
          input,
        }) => {
          const cursor = new AiRunPageCursor(input)

          expect(cursor)
            .toHaveProperty('runKey', input.runKey)
        })
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-0001',
          },
        },
        {
          input: {
            runKey: 'run-key-0002',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
      }) => {
        const received = AiRunPageCursor.create(input)

        expect(received)
          .toBeInstanceOf(AiRunPageCursor)
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('.create()', () => {
    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-0001',
          },
        },
        {
          input: {
            runKey: 'run-key-0002',
          },
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunPageCursor)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('.generateCursorText()', () => {
    describe('should encode the run key', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 'cnVuLWtleS0xMDAxMDAwMQ',
        },
        {
          input: {
            runKey: 'run-key-10700001',
          },
          expected: 'cnVuLWtleS0xMDcwMDAwMQ',
        },
        {
          // 32 random bytes as hex is what `RunKeyGenerator` mints, so the real length is covered
          input: {
            runKey: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
          },
          expected: 'MDEwMjAzMDQwNTA2MDcwODA5MGEwYjBjMGQwZTBmMTAxMTEyMTMxNDE1MTYxNzE4MTkxYTFiMWMxZDFlMWYyMA',
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
        expected,
      }) => {
        const received = AiRunPageCursor.generateCursorText(input)

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('.extractRunKey()', () => {
    describe('with valid values', () => {
      const cases = [
        {
          input: {
            cursorText: 'cnVuLWtleS0xMDAxMDAwMQ',
          },
          expected: 'run-key-10010001',
        },
        {
          input: {
            cursorText: 'cnVuLWtleS0xMDcwMDAwMQ',
          },
          expected: 'run-key-10700001',
        },
        {
          input: {
            cursorText: 'MDEwMjAzMDQwNTA2MDcwODA5MGEwYjBjMGQwZTBmMTAxMTEyMTMxNDE1MTYxNzE4MTkxYTFiMWMxZDFlMWYyMA',
          },
          expected: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        },
      ]

      test.each(cases)('cursorText: $input.cursorText', ({
        input,
        expected,
      }) => {
        const received = AiRunPageCursor.extractRunKey(input)

        expect(received)
          .toBe(expected)
      })
    })

    describe('with invalid values', () => {
      const cases = [
        {
          input: {
            cursorText: '',
          },
        },
        {
          input: {
            // a run key sent as it is, which is the cursor somebody builds by hand
            cursorText: 'run-key-10010001',
          },
        },
        {
          input: {
            // the same key under standard base64, padding and all
            cursorText: 'cnVuLWtleS0xMDAxMDAwMQ==',
          },
        },
        {
          input: {
            // decodes to bytes that are no text at all
            cursorText: 'abcd',
          },
        },
        {
          input: {
            cursorText: 'not-a-cursor!!',
          },
        },
        {
          input: {
            /*
             * Three NUL bytes. This is honest base64url and re-encodes to itself, so the round
             * trip alone accepted it and handed a string of NULs to a `where`, where the read
             * failed as a server fault instead of the `422` this route declares. Four characters.
             */
            cursorText: 'AAAA',
          },
        },
        {
          input: {
            // a key with a control character buried inside it, which the round trip also allows
            cursorText: 'cnVuLWtleS0xMAB0MDAwMDE',
          },
        },
        {
          input: {
            // longer than the column a run key is stored in
            cursorText: 'eA'.repeat(200),
          },
        },
      ]

      test.each(cases)('cursorText: $input.cursorText', ({
        input,
      }) => {
        const received = AiRunPageCursor.extractRunKey(input)

        expect(received)
          .toBeNull()
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('#get:Ctor', () => {
    describe('should answer the class the instance was built from', () => {
      const cases = [
        {
          input: {
            Ctor: AiRunPageCursor,
          },
          expected: 'AiRunPageCursor',
        },
        {
          input: {
            Ctor: class DerivedAiRunPageCursor extends AiRunPageCursor {},
          },
          expected: 'DerivedAiRunPageCursor',
        },
      ]

      test.each(cases)('Ctor: $input.Ctor.name', ({
        input,
        expected,
      }) => {
        const cursor = input.Ctor.create({
          runKey: 'run-key-0001',
        })

        const CursorCtor = cursor.Ctor
        const received = CursorCtor.name

        expect(received)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunPageCursor', () => {
  describe('#generateCursorText()', () => {
    describe('should encode the run key it holds', () => {
      const cases = [
        {
          input: {
            runKey: 'run-key-10010001',
          },
          expected: 'cnVuLWtleS0xMDAxMDAwMQ',
        },
        {
          input: {
            runKey: 'run-key-10700003',
          },
          expected: 'cnVuLWtleS0xMDcwMDAwMw',
        },
      ]

      test.each(cases)('runKey: $input.runKey', ({
        input,
        expected,
      }) => {
        const cursor = AiRunPageCursor.create(input)

        const received = cursor.generateCursorText()

        expect(received)
          .toBe(expected)
      })
    })
  })
})
