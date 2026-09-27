import BaseAiRunPurgeJobWorker from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import AiRunContentPurger from '../../../../../app/aiRunRetention/AiRunContentPurger.js'
import AiRunTracePurger from '../../../../../app/aiRunRetention/AiRunTracePurger.js'

import PurgeExpiredRunContentJobManifest from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobManifest.js'
import PurgeExpiredRunContentJobWorker from '../../../../../app/jobs/purge-expired-run-content/PurgeExpiredRunContentJobWorker.js'

/*
 * The wiring this concrete worker declares: which manifest, and which purger class.
 *
 * **Nothing in this file writes, which is the whole reason it is the file that is here.**
 * `.get:ManifestCtor`, `.get:AiRunPurgerCtor` and `.createAiRunPurger()` are declarations and a
 * construction; none of them reaches the database.
 *
 * **`#sweepExpiredAiRuns()` is not among them, and it used to be.** That method reaches
 * `AiRunContentPurger`, which updates rows inside a transaction — a transitive write, which
 * `rules/testing.md` places in `tests/_orders/**` whether or not the persisting call is mocked
 * away. It was kept here on the argument that a real sweep would empty every seeded run in the
 * database; that argument does not hold, because the fixture-isolation discipline
 * `tests/_orders/AiRunRetention/` already runs under — every run it creates accepted years before
 * anything else in the database, and every `now` putting the horizon in the same years — bounds a
 * sweep to the rows of the describe that created them. So the method's cases now live at
 * `tests/_orders/AiRunRetention/PurgeExpiredRunContentJobWorker.js`, where they exercise the
 * composition this file cannot: a worker built with its own **default** purger, handed a real
 * instant, actually purging rows.
 */

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunContentJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobWorker)
    })
  })
})

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentJobWorker.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunContentJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when called as is', () => {
      /*
       * The thirty-day clock, not the seven-hundred-and-thirty-day one. Wired to the wrong purger
       * this job would still fire nightly, still report a count and still look entirely healthy,
       * while content sat unpurged for two years — §7's promise about personal data broken with
       * nothing red anywhere. There is no downstream check that would catch it.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunContentJobWorker.AiRunPurgerCtor

        expect(actual)
          .toBe(AiRunContentPurger) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when compared with the trace purge', () => {
      /*
       * §19's first acceptance criterion kept at the worker: "content and the decision trace are
       * purged on two separate settings, and never on one". The case above pins which class; this
       * one pins that it is not the other, which is the failure a copied file produces.
       */
      test('should not be the trace purger', () => {
        const actual = PurgeExpiredRunContentJobWorker.AiRunPurgerCtor

        expect(actual)
          .not
          .toBe(AiRunTracePurger) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunContentJobWorker', () => {
  describe('.createAiRunPurger()', () => {
    describe('when called as is', () => {
      /*
       * The factory default the worker is built with when nothing is handed in — which is every
       * execution in the daemon, since the daemon constructs workers with the engine alone.
       */
      test('should create the content purger', () => {
        const actual = PurgeExpiredRunContentJobWorker.createAiRunPurger()

        expect(actual)
          .toBeInstanceOf(AiRunContentPurger)
      })
    })
  })
})
