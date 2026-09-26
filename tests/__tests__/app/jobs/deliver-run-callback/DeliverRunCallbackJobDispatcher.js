import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobDispatcher from '../../../../../app/aiRun/jobs/BaseAiRunJobDispatcher.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import DeliverRunCallbackJobDispatcher from '../../../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobDispatcher.js'
import DeliverRunCallbackJobManifest from '../../../../../app/jobs/deliver-run-callback/DeliverRunCallbackJobManifest.js'

/*
 * Section 12's eighth acceptance criterion: "a callback that fails to deliver is retried, though a
 * model call in the same run is not". Both halves of that sentence are decided in a dispatcher's
 * `optionHash`, and they point in opposite directions — which is why this file asserts both that
 * the option hash says what it must and that this class is not the one that says the opposite.
 */

describe('DeliverRunCallbackJobDispatcher', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = DeliverRunCallbackJobDispatcher.prototype

      expect(received)
        .toBeInstanceOf(BaseJobDispatcher)
    })
  })
})

describe('DeliverRunCallbackJobDispatcher', () => {
  describe('inheritance', () => {
    /*
     * `BaseAiRunJobDispatcher` sets `attempts: 1`, deliberately, so that a model call is never
     * retried automatically — section 11's third criterion. A callback dispatcher extending it
     * would inherit that and fail section 12's eighth criterion in complete silence: no error, no
     * log, and every run in the table carrying exactly one delivery row. This case is what turns
     * that silence into a red test.
     */
    test('should not be an AI run job dispatcher', () => {
      const received = DeliverRunCallbackJobDispatcher.prototype

      expect(received)
        .not
        .toBeInstanceOf(BaseAiRunJobDispatcher)
    })
  })
})

describe('DeliverRunCallbackJobDispatcher', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = DeliverRunCallbackJobDispatcher.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('DeliverRunCallbackJobDispatcher', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = DeliverRunCallbackJobDispatcher.ManifestCtor

        expect(actual)
          .toBe(DeliverRunCallbackJobManifest) // same reference
      })
    })
  })
})

describe('DeliverRunCallbackJobDispatcher', () => {
  describe('.get:optionHash', () => {
    describe('when called as is', () => {
      /*
       * The whole hash is asserted rather than the one field, exactly as the AI run dispatcher's
       * own case does for `attempts: 1`. A test reading only "attempts is not 1" would pass on a
       * wrong value; a test reading only `attempts` would pass on a backoff removed beside it,
       * which would spend all seven attempts inside the first second of a client's outage.
       */
      test('should be fixed value', () => {
        const expected = {
          defaultJobOptions: {
            attempts: 7,
            backoff: {
              type: 'exponential',
              delay: 60000,
            },
          },
        }

        const actual = DeliverRunCallbackJobDispatcher.optionHash

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
