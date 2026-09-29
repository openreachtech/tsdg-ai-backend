import BaseAiRunPurgeJobWorker from '../../../../../app/aiRunRetention/jobs/BaseAiRunPurgeJobWorker.js'

import AiRunContentPurger from '../../../../../app/aiRunRetention/AiRunContentPurger.js'
import AiRunTracePurger from '../../../../../app/aiRunRetention/AiRunTracePurger.js'

import PurgeExpiredRunTracesJobManifest from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobManifest.js'
import PurgeExpiredRunTracesJobWorker from '../../../../../app/jobs/purge-expired-run-traces/PurgeExpiredRunTracesJobWorker.js'

/*
 * The wiring this concrete worker declares: which manifest, and which purger class.
 *
 * **Nothing in this file writes, which is the whole reason it is the file that is here.**
 * `.get:ManifestCtor`, `.get:AiRunPurgerCtor` and `.createAiRunPurger()` are declarations and a
 * construction; none of them reaches the database.
 *
 * **`#sweepExpiredAiRuns()` is not among them, and it used to be.** That method reaches
 * `AiRunTracePurger`, which deletes rows inside a transaction — a transitive write, which
 * `rules/testing.md` places in `tests/_orders/**` whether or not the persisting call is mocked
 * away. It was kept here on the argument that a real sweep would reach every seeded run in the
 * database; that argument does not hold, because the fixture-isolation discipline
 * `tests/_orders/AiRunRetention/` already runs under bounds a sweep to the rows of the describe
 * that created them. So the method's cases now live at
 * `tests/_orders/AiRunRetention/PurgeExpiredRunTracesJobWorker.js`, where they exercise the
 * composition this file cannot: a worker built with its own **default** purger, handed a real
 * instant, actually deleting a trace.
 */

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('inheritance', () => {
    test('should be correct class', () => {
      const received = PurgeExpiredRunTracesJobWorker.prototype

      expect(received)
        .toBeInstanceOf(BaseAiRunPurgeJobWorker)
    })
  })
})

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('.get:ManifestCtor', () => {
    describe('when called as is', () => {
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesJobWorker.ManifestCtor

        expect(actual)
          .toBe(PurgeExpiredRunTracesJobManifest) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when called as is', () => {
      /*
       * The seven-hundred-and-thirty-day clock, not the thirty-day one. Wired to the content
       * purger, this weekly job would empty the content of every run past thirty days a second
       * time — harmless, because that purge is idempotent — while the decision trace was never
       * deleted at all, and §19's promise that the trace is kept for two years and then removed
       * would quietly become "kept forever". Nothing downstream would notice.
       */
      test('should be fixed value', () => {
        const actual = PurgeExpiredRunTracesJobWorker.AiRunPurgerCtor

        expect(actual)
          .toBe(AiRunTracePurger) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('.get:AiRunPurgerCtor', () => {
    describe('when compared with the content purge', () => {
      /*
       * §19's first acceptance criterion kept at the worker: "content and the decision trace are
       * purged on two separate settings, and never on one". The case above pins which class; this
       * one pins that it is not the other, which is the failure a copied file produces.
       */
      test('should not be the content purger', () => {
        const actual = PurgeExpiredRunTracesJobWorker.AiRunPurgerCtor

        expect(actual)
          .not
          .toBe(AiRunContentPurger) // same reference
      })
    })
  })
})

describe('PurgeExpiredRunTracesJobWorker', () => {
  describe('.createAiRunPurger()', () => {
    describe('when called as is', () => {
      /*
       * The factory default the worker is built with when nothing is handed in — which is every
       * execution in the daemon, since the daemon constructs workers with the engine alone.
       */
      test('should create the trace purger', () => {
        const actual = PurgeExpiredRunTracesJobWorker.createAiRunPurger()

        expect(actual)
          .toBeInstanceOf(AiRunTracePurger)
      })
    })
  })
})
