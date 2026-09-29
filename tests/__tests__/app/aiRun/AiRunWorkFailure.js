import AiRunWorkFailure from '../../../../app/aiRun/AiRunWorkFailure.js'

/*
 * The carrier a run's work raises when it knows why the run is over.
 *
 * Nothing here touches the database or the queue: it is a value with a class, and what it is for is
 * that `#executeAiRunWork()`'s only failure channel is a throw while the row wants a reason code
 * and the parameters that reason names.
 */

describe('AiRunWorkFailure', () => {
  describe('super class', () => {
    test('to be instance of Error', () => {
      const received = AiRunWorkFailure.prototype

      expect(received)
        .toBeInstanceOf(Error)
    })
  })
})

describe('AiRunWorkFailure', () => {
  describe('constructor', () => {
    describe('to keep properties', () => {
      describe('#failureReasonCode', () => {
        const cases = [
          {
            params: {
              message: 'the work of a run failed: MEDIA_LIMIT_EXCEEDED',
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                maximumMediaCount: 12,
              },
            },
          },
          {
            params: {
              message: 'the work of a run failed: MEDIA_UNSUPPORTED',
              failureReasonCode: 'MEDIA_UNSUPPORTED',
              failureParameters: {
                mediaCategoryName: 'video',
              },
            },
          },
          {
            params: {
              message: 'the work of a run failed: MEDIA_UNREADABLE',
              failureReasonCode: 'MEDIA_UNREADABLE',
              failureParameters: null,
            },
          },
        ]

        test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
          params,
        }) => {
          const failure = new AiRunWorkFailure(params)

          expect(failure)
            .toHaveProperty('failureReasonCode', params.failureReasonCode)
        })
      })

      describe('#failureParameters', () => {
        const cases = [
          {
            params: {
              message: 'the work of a run failed: MEDIA_LIMIT_EXCEEDED',
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: {
                maximumMediaCount: 12,
              },
            },
          },
          {
            params: {
              message: 'the work of a run failed: MEDIA_FETCH_FAILED',
              failureReasonCode: 'MEDIA_FETCH_FAILED',
              failureParameters: {
                mediaKey: 'media-key-of-the-one-that-stalled',
              },
            },
          },
          {
            params: {
              message: 'the work of a run failed: MEDIA_UNREADABLE',
              failureReasonCode: 'MEDIA_UNREADABLE',
              failureParameters: null,
            },
          },
        ]

        test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
          params,
        }) => {
          const failure = new AiRunWorkFailure(params)

          expect(failure)
            .toHaveProperty('failureParameters', params.failureParameters)
        })
      })

      describe('#message', () => {
        const cases = [
          {
            params: {
              message: 'the work of a run failed: MEDIA_LIMIT_EXCEEDED',
              failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
              failureParameters: null,
            },
          },
          {
            params: {
              message: 'the work of a run failed: OUTPUT_INVALID',
              failureReasonCode: 'OUTPUT_INVALID',
              failureParameters: null,
            },
          },
        ]

        test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
          params,
        }) => {
          const failure = new AiRunWorkFailure(params)

          expect(failure)
            .toHaveProperty('message', params.message)
        })
      })
    })
  })
})

describe('AiRunWorkFailure', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            failureReasonCode: 'MEDIA_UNSUPPORTED',
            failureParameters: {
              mediaCategoryName: 'video',
            },
          },
        },
        {
          params: {
            failureReasonCode: 'PROVIDER_CALL_FAILED',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
        params,
      }) => {
        const actual = AiRunWorkFailure.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunWorkFailure)
      })
    })

    describe('should be call by constructor', () => {
      const cases = [
        {
          params: {
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              maximumMediaCount: 12,
            },
          },
          expected: {
            message: 'the work of a run failed: MEDIA_LIMIT_EXCEEDED',
            failureReasonCode: 'MEDIA_LIMIT_EXCEEDED',
            failureParameters: {
              maximumMediaCount: 12,
            },
          },
        },
        {
          params: {
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
          expected: {
            message: 'the work of a run failed: TIME_LIMIT_EXCEEDED',
            failureReasonCode: 'TIME_LIMIT_EXCEEDED',
            failureParameters: null,
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
        params,
        expected,
      }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(AiRunWorkFailure)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })

    /*
     * A failure whose reason names no parameters is the ordinary case - six of the seven codes
     * the client contract fixes carry none, `MEDIA_LIMIT_EXCEEDED` being the one that does - so
     * the parameters may be left off the call and the row is written with an explicit null rather
     * than with nothing.
     */
    describe('should use default failureParameters value', () => {
      const cases = [
        {
          params: {
            failureReasonCode: 'MEDIA_UNREADABLE',
          },
        },
        {
          params: {
            failureReasonCode: 'PROVIDER_CALL_FAILED',
          },
        },
      ]

      test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
        params,
      }) => {
        const failure = AiRunWorkFailure.create(params)

        expect(failure)
          .toHaveProperty('failureParameters', null)
      })
    })
  })
})

describe('AiRunWorkFailure', () => {
  describe('.generateMessage()', () => {
    /*
     * The reason code is the whole of what the message says, beside the class's own name. Nothing a
     * caller sent goes into it: `BaseAiRunJobWorker` logs a failure's class and its reason code and
     * leaves the thrown message where it was thrown, and a message built out of a URL or a file
     * name would put the payload back into that decision.
     */
    const cases = [
      {
        params: {
          failureReasonCode: 'MEDIA_UNSUPPORTED',
        },
        expected: 'the work of a run failed: MEDIA_UNSUPPORTED',
      },
      {
        params: {
          failureReasonCode: 'OUTPUT_INVALID',
        },
        expected: 'the work of a run failed: OUTPUT_INVALID',
      },
    ]

    test.each(cases)('failureReasonCode: $params.failureReasonCode', ({
      params,
      expected,
    }) => {
      const actual = AiRunWorkFailure.generateMessage(params)

      expect(actual)
        .toBe(expected)
    })
  })
})
