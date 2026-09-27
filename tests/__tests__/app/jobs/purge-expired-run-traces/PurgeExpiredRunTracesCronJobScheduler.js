import BaseAiRunPurgeCronJobScheduler from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeCronJobScheduler.js'

import AppJobEngine from '../../../../../app/queue/AppJobEngine.js'

import PurgeExpiredRunContentCronJobScheduler from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentCronJobScheduler.js'
import PurgeExpiredRunTracesCronJobScheduler from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesCronJobScheduler.js'
import PurgeExpiredRunTracesJobManifest from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobManifest.js'

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunTracesCronJobScheduler.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeCronJobScheduler)
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:EngineCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesCronJobScheduler.EngineCtor

        expect(actual)
          .toBe(AppJobEngine) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesCronJobScheduler.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunTracesJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:schedulerId', () => {
    describe('when called as is', () => {
      /*
       * BullMQ keys the repeatable job by this string, so changing it registers a second schedule
       * rather than renaming the first — and the orphan would keep firing a weekly sweep nothing
       * knows how to stop.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesCronJobScheduler.schedulerId

        expect(actual)
          .toBe('purge-expired-run-traces')
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:schedulerId', () => {
    describe('when compared with the content purge', () => {
      /*
       * Two ids, because BullMQ stores one repeatable job per id: sharing one would mean the
       * second registration overwrote the first, leaving a single schedule where §19 declares two
       * — and the one left standing would carry whichever cadence happened to be written last.
       */
      test('should be a different schedule', () => {
        const expected = PurgeExpiredRunContentCronJobScheduler.schedulerId

        const actual = PurgeExpiredRunTracesCronJobScheduler.schedulerId

        expect(actual)
          .not
          .toBe(expected)
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:cronExpression', () => {
    describe('when called as is', () => {
      /*
       * §19's "a schedule on the longer horizon", turned into weekly — the one line of that table
       * that needed deciding rather than copying, so the reasoning is pinned here as a literal.
       *
       * It cannot mean every seven hundred and thirty days: a run reaching its horizon the day
       * after a firing would wait most of another two years, so actual retention would run to
       * four years against a stated two. A schedule keyed to the length of a horizon doubles it.
       *
       * Weekly rather than monthly is arithmetic, not taste. One sweep reaches fifty batches of
       * two hundred runs; §7's volume is about a thousand runs a day, so about a thousand cross
       * any horizon each day. A week accumulates about seven thousand and clears them; a month
       * would accumulate about thirty thousand and clear ten, so the backlog would grow by twenty
       * thousand every month, `isSweepExhausted` would read false forever, and the two-year
       * promise would never be kept again — with the job working exactly as configured. Weekly is
       * the longest cadence the sweep bound sustains.
       *
       * The hour is 04:00 and not 03:00 because the content purge fires at 03:00 every day,
       * Sundays included: sharing it would start the heaviest sweep in the service in the same
       * minute as the one bounded by a promise about personal data.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesCronJobScheduler.cronExpression

        expect(actual)
          .toBe('0 4 * * 0')
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.get:cronExpression', () => {
    describe('when compared with the content purge', () => {
      /*
       * §19's first acceptance criterion — "content and the decision trace are purged on two
       * separate settings, and never on one" — kept at the schedule, which is the outermost of
       * the three places it holds. The other two are the two constant files carrying the two
       * horizons, and the two purger method names.
       *
       * It is asserted as a difference rather than by reading either literal, because that is the
       * shape of the mistake: a cadence copied from the sibling file during an edit passes both
       * of the `toBe` cases in isolation, and the result — both purges on one schedule — is
       * exactly what the criterion forbids and what nothing downstream would report.
       */
      test('should be a different cadence', () => {
        const expected = PurgeExpiredRunContentCronJobScheduler.cronExpression

        const actual = PurgeExpiredRunTracesCronJobScheduler.cronExpression

        expect(actual)
          .not
          .toBe(expected)
      })
    })
  })
})

describe('PurgeExpiredRunTracesCronJobScheduler', () => {
  describe('.buildScheduleInput()', () => {
    describe('when called as is', () => {
      /*
       * The whole input, because every field of it is a way for the schedule to silently not
       * exist — see the content scheduler's own case for the mechanism.
       */
      test('should be fixed value', () => {
        const expected = {
          schedulerId: 'purge-expired-run-traces',
          schedule: {
            cronExpression: '0 4 * * 0',
          },
          body: {},
          optionHash: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 300000,
            },
            removeOnComplete: {
              count: 90,
            },
            removeOnFail: {
              count: 90,
            },
          },
        }

        const actual = PurgeExpiredRunTracesCronJobScheduler.buildScheduleInput()

        expect(actual)
          .toEqual(expected)
      })
    })
  })
})
