import AiRunMediaLimitInspector from '../../../../app/aiRunMedia/AiRunMediaLimitInspector.js'

/*
 * The second acceptance criterion of section 18 is what this file exists for: "byte size is checked
 * before anything reaches a provider, and a file over the cap fails the run with the limit named in
 * the reason's parameters". Both halves are asserted - the check, and the parameters that name the
 * limit it went past.
 *
 * The boundary is tested from both sides on purpose. A file of exactly ten megabytes is within the
 * cap and a file one byte past it is not, and an implementation using `<` where it wanted `<=`
 * passes every case that is not at the boundary.
 *
 * `20971521` is the size the development seeder gives its over-cap medium (`10410010`), so the
 * fixture that exists to be refused is refused here by the class that will refuse it.
 */

describe('AiRunMediaLimitInspector', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#maximumByteSize', () => {
        const cases = [
          {
            params: {
              maximumByteSize: 10485760,
              maximumMediaCount: 12,
            },
            expected: 10485760,
          },
          {
            params: {
              maximumByteSize: 2048,
              maximumMediaCount: 3,
            },
            expected: 2048,
          },
        ]

        test.each(cases)('maximumByteSize: $params.maximumByteSize', ({
          params,
          expected,
        }) => {
          const inspector = new AiRunMediaLimitInspector(params)

          expect(inspector)
            .toHaveProperty('maximumByteSize', expected)
        })
      })

      describe('#maximumMediaCount', () => {
        const cases = [
          {
            params: {
              maximumByteSize: 10485760,
              maximumMediaCount: 12,
            },
            expected: 12,
          },
          {
            params: {
              maximumByteSize: 2048,
              maximumMediaCount: 3,
            },
            expected: 3,
          },
        ]

        test.each(cases)('maximumMediaCount: $params.maximumMediaCount', ({
          params,
          expected,
        }) => {
          const inspector = new AiRunMediaLimitInspector(params)

          expect(inspector)
            .toHaveProperty('maximumMediaCount', expected)
        })
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
        },
        {
          params: {
            maximumByteSize: 2048,
            maximumMediaCount: 3,
          },
        },
      ]

      test.each(cases)('maximumByteSize: $params.maximumByteSize', ({
        params,
      }) => {
        const actual = AiRunMediaLimitInspector.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaLimitInspector)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          expected: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
        },
        {
          params: {
            maximumByteSize: 2048,
            maximumMediaCount: 3,
          },
          expected: {
            maximumByteSize: 2048,
            maximumMediaCount: 3,
          },
        },
      ]

      test.each(cases)('maximumByteSize: $params.maximumByteSize', ({
        params,
        expected,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaLimitInspector)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    describe('should fill the limits the specification states', () => {
      test('with no arguments', () => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaLimitInspector)
        const expected = {
          maximumByteSize: 10485760,
          maximumMediaCount: 12,
        }

        SpyClass.create()

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#isWithinByteSizeLimit()', () => {
    describe('should accept a file within the cap', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 204811,
          },
          label: 'a photo of the ordinary size',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 10485760,
          },
          label: 'a file of exactly the cap, which is within it',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: '761244',
          },
          label: 'a size handed back as text, which is how MariaDB hands a BIGINT over',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 0,
          },
          label: 'a file declared as weighing nothing, which the fetch refuses rather than the cap',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWithinByteSizeLimit(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a file the cap does not allow', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 10485761,
          },
          label: 'one byte past the cap',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 20971521,
          },
          label: 'the over-cap medium the development seeder carries',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: '20971521',
          },
          label: 'the same size handed back as text',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: null,
          },
          label: 'no size at all, which is not the same as a small one',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: -1,
          },
          label: 'a negative size',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 1024.5,
          },
          label: 'a size that is not a whole number of bytes',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: '1e9',
          },
          label: 'a size written in exponent notation',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: '204811 ',
          },
          label: 'a size with something after it',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: Number.NaN,
          },
          label: 'a value that is not a number',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWithinByteSizeLimit(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#isWithinMediaCountLimit()', () => {
    describe('should accept a request within the limit', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 4,
          },
          label: 'the four photos a seeded run carries',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 12,
          },
          label: 'exactly the limit, which is within it',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 0,
          },
          label: 'a request carrying no media, which this limit has nothing to say about',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWithinMediaCountLimit(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a request past the limit', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 13,
          },
          label: 'one file past the limit',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 100,
          },
          label: 'a request carrying far more',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: null,
          },
          label: 'no count at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWithinMediaCountLimit(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#generateComparableWholeNumber()', () => {
    describe('should generate the number a figure names', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: 204811,
          },
          expected: 204811,
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: '512322',
          },
          expected: 512322,
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: '0',
          },
          expected: 0,
        },
      ]

      test.each(cases)('value: $params.value', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.generateComparableWholeNumber(params)

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null when the value names no figure', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: '007',
          },
          label: 'digits written with a leading zero',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: '+3',
          },
          label: 'a signed figure',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: {},
          },
          label: 'an object',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: true,
          },
          label: 'a boolean',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.generateComparableWholeNumber(params)

        expect(actual)
          .toBeNull()
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#buildExceededByteSizeLimitParameters()', () => {
    /*
     * `MEDIA_LIMIT_EXCEEDED` is the one reason code of the seven that carries parameters, and this
     * is what it carries: the name of the limit, the figure it is set to, and what was declared
     * against it. The client system builds the sentence people read out of exactly these.
     */
    describe('should name the size limit and what was declared against it', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 20971521,
          },
          expected: {
            limitName: 'mediaByteSize',
            limitValue: 10485760,
            declaredValue: 20971521,
          },
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: '31457300',
          },
          expected: {
            limitName: 'mediaByteSize',
            limitValue: 10485760,
            declaredValue: 31457300,
          },
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            byteSize: 'as-large-as-you-like',
          },
          expected: {
            limitName: 'mediaByteSize',
            limitValue: 10485760,
            declaredValue: null,
          },
        },
      ]

      test.each(cases)('byteSize: $params.byteSize', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.buildExceededByteSizeLimitParameters(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#buildExceededMediaCountLimitParameters()', () => {
    describe('should name the count limit and what was declared against it', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 13,
          },
          expected: {
            limitName: 'mediaCount',
            limitValue: 12,
            declaredValue: 13,
          },
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: 40,
          },
          expected: {
            limitName: 'mediaCount',
            limitValue: 12,
            declaredValue: 40,
          },
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            mediaCount: null,
          },
          expected: {
            limitName: 'mediaCount',
            limitValue: 12,
            declaredValue: null,
          },
        },
      ]

      test.each(cases)('mediaCount: $params.mediaCount', ({
        factoryParams,
        params,
        expected,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.buildExceededMediaCountLimitParameters(params)

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaLimitInspector', () => {
  describe('#isWholeNumber()', () => {
    describe('should accept a figure something can be measured in', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: 0,
          },
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: 204811,
          },
        },
      ]

      test.each(cases)('value: $params.value', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWholeNumber(params)

        expect(actual)
          .toBeTruthy()
      })
    })

    describe('should refuse a number nothing is measured in', () => {
      const cases = [
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: -1,
          },
          label: 'a negative figure',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: 0.5,
          },
          label: 'half of something',
        },
        {
          factoryParams: {
            maximumByteSize: 10485760,
            maximumMediaCount: 12,
          },
          params: {
            value: Number.POSITIVE_INFINITY,
          },
          label: 'a figure without end',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const inspector = AiRunMediaLimitInspector.create(factoryParams)

        const actual = inspector.isWholeNumber(params)

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
