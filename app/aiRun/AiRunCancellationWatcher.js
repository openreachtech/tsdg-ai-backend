import timersPromises from 'node:timers/promises'

import AiRunCancellationInspector from './AiRunCancellationInspector.js'

/*
 * How long the watch waits between two readings of the run's cancellation column, in milliseconds
 * because that is the unit every timer in Node takes.
 *
 * **It is an interval rather than a subscription because there is nothing to subscribe to.** The
 * cancellation is written by the API process into a row; the work honoring it runs in the worker
 * process. Nothing between the two pushes, so the only way the worker learns is by asking.
 *
 * **One second, derived from what the question costs and what it buys.** §7 puts the version at
 * ~1,000 runs a day and the run time limit at 300 seconds, so a run asking once a second is at most
 * 300 single-row reads on a table indexed by its primary key — against the twelve file fetches and
 * three provider readings the same run makes, it is not a cost this version can measure. Waiting
 * longer would buy nothing back and would leave a client watching a run it has already paid to stop.
 *
 * **What it does not decide is how long canceling takes.** The run stops at the next boundary its
 * work honors the signal at, and a reading of a photo takes longer than this interval by a wide
 * margin. Shortening it would move the poll and not the stop.
 *
 * It is the default of the factory method rather than a literal inside a member, so a test can
 * state a few milliseconds instead of waiting out seconds of real time.
 */
const DEFAULT_WATCH_INTERVAL_MILLISECONDS = 1000

/**
 * Watches one run for a cancellation while its work is in flight, and tells the work to stop.
 *
 * **Why a watch exists at all.** §15's second acceptance criterion is that "a running run stops at
 * the next step boundary, never mid-step". The boundaries are already built —
 * `AiRunMediaCollector` asks the signal before it fetches the next medium and
 * `AssetMediaReadingFetcher` asks it before it takes the next reading — and what was missing is
 * anything that raises the signal for a reason other than the time limit. This class is that
 * reason.
 *
 * **It raises the work's own terminator and creates no controller of its own.**
 * `BaseAiRunJobWorker` already runs two the work can hear about, and its docblock names them as
 * "the two cancellations that run opposite ways round": one is raised where the time limit won,
 * the other stops the timer measuring it. A third **signal** would be a third thing a work had to
 * be taught to watch. Instead the controller a delivery already hands its work is handed here too,
 * so a client's cancellation and the run's time limit reach the work through the one channel it
 * already honors, and a work that stops for either stops in the same place.
 *
 * The delivery does build a controller for the watch itself — `watchSignal` below — but that one
 * is never shown to the work: it says only that nobody needs this watch any more.
 *
 * **The watch is stopped by its own signal, not by its own answer.** A run whose work finished
 * inside its limit was never canceled, and a timer still asking about it would keep a query going
 * after the row had settled — the same leak `BaseAiRunJobWorker` closes by aborting its alarm
 * whichever way the race ended. So the caller holds a signal of its own for stopping this watch,
 * and raises it when the work is done with; the wait rejects, and this answers false.
 *
 * **What it answers is what the delivery records the run as.** A watch that found a cancellation
 * answers true, and that is the delivery's evidence that the run stopped because a client asked
 * rather than because the work ran out of things to do. A work that honored the signal returns
 * whatever it had settled by then, which looks exactly like a work that finished — so the delivery
 * cannot tell the two apart from the work's own answer, and this boolean is what tells it.
 *
 * **It writes nothing.** The run's statuses belong to `AiRunStatusRecorder` and the delivery that
 * claimed the run, and a watcher that recorded a terminal state could produce the second one §11's
 * fifth criterion rules out. This class reads one column and raises one signal.
 */
export default class AiRunCancellationWatcher {
  /**
   * Constructor.
   *
   * @param {AiRunCancellationWatcherParams} params - Parameters.
   */
  constructor ({
    aiRunCancellationInspector,
    watchIntervalMilliseconds,
  }) {
    this.aiRunCancellationInspector = aiRunCancellationInspector
    this.watchIntervalMilliseconds = watchIntervalMilliseconds
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunCancellationWatcher ? X : never} T, X
   * @param {AiRunCancellationWatcherFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunCancellationInspector = this.createAiRunCancellationInspector(),
    watchIntervalMilliseconds = DEFAULT_WATCH_INTERVAL_MILLISECONDS,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunCancellationInspector,
        watchIntervalMilliseconds,
      })
    )
  }

  /**
   * get: the promise-shaped timers, wrapped so a test can substitute them.
   *
   * @returns {typeof timersPromises} The timers.
   */
  static get timersPromises () {
    return timersPromises
  }

  /**
   * Create the inspector answering whether a run has been asked to stop.
   *
   * @returns {AiRunCancellationInspector} Inspector.
   */
  static createAiRunCancellationInspector () {
    return AiRunCancellationInspector.create()
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunCancellationWatcher} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunCancellationWatcher} */ (this.constructor)
  }

  /**
   * Watch one run until it is canceled or the watch is stopped, and answer which happened.
   *
   * **It waits before it asks, and that ordering is a decision.** A run already carrying a
   * cancellation when its job was picked up is the delivery's own question to ask, once, before it
   * does any work — which is what makes §15's first criterion say "having made zero model calls".
   * Asking here first as well would be that same question a second time, a few microseconds later,
   * and would say nothing the delivery did not already know.
   *
   * **It recurses rather than loops.** A loop is not available — this repository's lint forbids
   * every imperative form of one — and the shape wanted here is not one a `reduce` expresses
   * either, because how many times it asks is not known before it starts. Each turn is one `await`
   * deep and unwinds before the next begins, so the recursion holds no stack: a run watched for the
   * whole of its 300-second limit is 300 turns, none of them nested inside another.
   *
   * @param {WatchAiRunCancellationParams} params - Parameters.
   * @returns {Promise<boolean>} Whether a cancellation was found and the work told to stop.
   * @throws {Error} When the id handed in is not an id.
   * @public
   */
  async watchAiRunCancellation ({
    aiRunId,
    aiRunWorkTerminator,
    watchSignal,
  }) {
    const hasWaited = await this.waitOutWatchInterval({
      watchSignal,
    })

    if (!hasWaited) {
      return false
    }

    const hasRaised = await this.raiseAiRunCancellation({
      aiRunId,
      aiRunWorkTerminator,
    })

    if (hasRaised) {
      return true
    }

    return this.watchAiRunCancellation({
      aiRunId,
      aiRunWorkTerminator,
      watchSignal,
    })
  }

  /**
   * Wait out one interval, and answer whether it passed or the watch was stopped inside it.
   *
   * **The rejection is the stop, not a failure, which is why it is answered rather than logged.**
   * `timersPromises.setTimeout()` rejects when the signal it was given is raised, and the only
   * thing that raises this one is the caller saying it has no more use for the watch. There is
   * nothing an operator could do about it and nothing a line would tell them that the run's own
   * terminal record does not. Anything else — which this member knows of none — is rethrown, so a
   * fault cannot arrive disguised as an ordinary stop.
   *
   * The timer is unreferenced for the same reason `BaseAiRunJobWorker` unreferences its alarm: a
   * wait that somehow outlived its stop must not be what keeps the process alive.
   *
   * @param {{
   *   watchSignal: AbortSignal
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the interval passed.
   * @throws {Error} When the wait failed for any reason other than the watch being stopped.
   * @public
   */
  async waitOutWatchInterval ({
    watchSignal,
  }) {
    try {
      await this.Ctor.timersPromises.setTimeout(
        this.watchIntervalMilliseconds,
        null,
        {
          ref: false,
          signal: watchSignal,
        }
      )

      return true
    } catch (error) {
      if (watchSignal.aborted) {
        return false
      }

      throw error
    }
  }

  /**
   * Ask once whether this run has been canceled, and raise the work's signal where it has.
   *
   * One reading and one raising, in a member of its own, so that the turn the watch repeats can be
   * stated by a test without waiting out an interval — and so that the only place in this service
   * that tells a work its client has stopped caring is a member a reader can name.
   *
   * @param {{
   *   aiRunId: number
   *   aiRunWorkTerminator: AbortController
   * }} params - Parameters.
   * @returns {Promise<boolean>} Whether the work was told to stop.
   * @throws {Error} When the id handed in is not an id.
   * @public
   */
  async raiseAiRunCancellation ({
    aiRunId,
    aiRunWorkTerminator,
  }) {
    const hasAiRunCancelRequest = await this.aiRunCancellationInspector.hasAiRunCancelRequest({
      aiRunId,
    })

    if (!hasAiRunCancelRequest) {
      return false
    }

    aiRunWorkTerminator.abort()

    return true
  }
}

/**
 * @typedef {{
 *   aiRunCancellationInspector: AiRunCancellationInspector
 *   watchIntervalMilliseconds: number
 * }} AiRunCancellationWatcherParams
 */

/**
 * @typedef {Partial<AiRunCancellationWatcherParams>} AiRunCancellationWatcherFactoryParams
 */

/**
 * @typedef {{
 *   aiRunId: number
 *   aiRunWorkTerminator: AbortController
 *   watchSignal: AbortSignal
 * }} WatchAiRunCancellationParams
 */
