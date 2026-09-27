import {
  BaseJobManifest,
  ConcreteMemberNotFoundJobError,
  JobBody,
} from '@openreachtech/renchan-job-bullmq'

import BaseAiRunJobManifest from '../../../../../app/aiRun/jobs/BaseAiRunJobManifest.js'

import BaseAiRunPurgeJobManifest from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobManifest.js'

describe('BaseAiRunPurgeJobManifest', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = BaseAiRunPurgeJobManifest.prototype

      expect(received)
        .toBeInstanceOf(BaseJobManifest)
    })
  })
})

describe('BaseAiRunPurgeJobManifest', () => {
  describe('inheritance', () => {
    /*
     * `BaseAiRunJobManifest` declares `{ aiRunId: Integer }`, because a run's job is dispatched
     * about one run. §19 gives both purges a payload of **none**: a purge is about every run past
     * a horizon and selects its own set. A manifest inheriting that field would declare one
     * neither purge has any use for, and would read as though a purge were dispatched per run.
     */
    test('should not be an AI run job manifest', () => {
      const received = BaseAiRunPurgeJobManifest.prototype

      expect(received)
        .not
        .toBeInstanceOf(BaseAiRunJobManifest)
    })
  })
})

describe('BaseAiRunPurgeJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('when called as is', () => {
      /*
       * §19's payload column for both purge rows reads "none". The empty hash is the written form
       * of that, and it is asserted as a whole rather than by absence: a field added here would be
       * a value carried in a repeatable job's template, which is written once at registration and
       * replayed forever — so anything time-varying put there would be frozen at the moment
       * somebody ran the registration script.
       */
      test('should be fixed value', () => {
        const expected = {}

        const actual = BaseAiRunPurgeJobManifest.bodySchema

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})

describe('BaseAiRunPurgeJobManifest', () => {
  describe('.get:jobName', () => {
    describe('when the concrete manifest has not filled it in', () => {
      /*
       * Abstract, because one queue is one job directory and §19 gives the two purges two queues.
       * A default here would be a queue name two jobs could silently share, and a shared queue is
       * what lets the weekly trace backlog delay the nightly content purge.
       */
      test('should throw', () => {
        const actual = () => BaseAiRunPurgeJobManifest.jobName

        expect(actual)
          .toThrow(ConcreteMemberNotFoundJobError)
      })
    })
  })
})

describe('BaseAiRunPurgeJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('should accept an empty body', () => {
      /*
       * What the empty schema is actually for. `BaseJobSchedulerService.resolveScheduleInput()`
       * substitutes `body: null` for a scheduler it finds no input under, and a null body has to
       * be refused — otherwise a schedule that was never configured registers anyway and fires a
       * job the worker cannot make sense of. So the pair is asserted together: `{}` passes and
       * `null` does not.
       */
      const cases = [
        {
          params: {
            normalizedBody: {},
          },
        },
        {
          params: {
            normalizedBody: {
              unexpectedField: 'kept by the framework normalization, read by nothing',
            },
          },
        },
      ]

      test.each(cases)('normalizedBody: $params.normalizedBody', ({
        params,
      }) => {
        const BoundJobBodyCtor = JobBody.as(BaseAiRunPurgeJobManifest.bodySchema)

        const actual = BoundJobBodyCtor.create(params)
          .isValid()

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('BaseAiRunPurgeJobManifest', () => {
  describe('.get:bodySchema', () => {
    describe('should refuse an absent body', () => {
      const cases = [
        {
          params: {
            normalizedBody: null,
          },
        },
      ]

      test.each(cases)('normalizedBody: $params.normalizedBody', ({
        params,
      }) => {
        const BoundJobBodyCtor = JobBody.as(BaseAiRunPurgeJobManifest.bodySchema)

        const actual = BoundJobBodyCtor.create(params)
          .isValid()

        expect(actual)
          .toBeFalsy()
      })
    })
  })
})
