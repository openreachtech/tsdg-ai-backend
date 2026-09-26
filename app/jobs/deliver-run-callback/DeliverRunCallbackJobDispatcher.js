import {
  BaseJobDispatcher,
} from '@openreachtech/renchan-job-bullmq'

import AppJobEngine from '../../queue/AppJobEngine.js'

import DeliverRunCallbackJobManifest from './DeliverRunCallbackJobManifest.js'

/*
 * How many times BullMQ may attempt one terminal callback.
 *
 * **Seven, and the number is the whole point of this file.** Section 12's eighth acceptance
 * criterion is that a callback which fails to deliver **is retried**, though a model call in the
 * same run is not — the two halves of one sentence, pulling in opposite directions. The other half
 * is already written: `BaseAiRunJobDispatcher` sets `attempts: 1` so that a run which fails on a
 * provider error reports it rather than calling again. **This dispatcher therefore does not extend
 * that class.** A subclass of it would inherit `attempts: 1` and fail this criterion in complete
 * silence — no error, no log, nothing red — leaving every run in the table carrying exactly one
 * delivery row and looking, to anybody counting, as though no callback had ever needed retrying.
 *
 * **Why seven rather than three or thirty.** With the backoff below, seven attempts span about an
 * hour of trying (1 + 2 + 4 + 8 + 16 + 32 minutes of waiting between them), and an hour is the
 * outage section 7 calls tolerable. Past that the callback stops being the client's route to the
 * answer and the read-back is: "the client system that missed a callback reconciles by reading the
 * run back by its key" is section 12's own second use case, and it is what bounds this number.
 * Unbounded retrying would post a run's whole result at a client that has moved on, for as long as
 * Redis kept the job.
 */
const TERMINAL_CALLBACK_ATTEMPT_COUNT = 7

/*
 * The backoff between two attempts at one terminal callback.
 *
 * Exponential from one minute. A client's service that is down is usually down for longer than the
 * gap between two tries, so a fixed short delay spends the whole budget inside the first minute of
 * an outage and gives up before anybody has noticed it. Doubling spends the same seven attempts
 * across an hour instead.
 */
const TERMINAL_CALLBACK_BACKOFF_TYPE = 'exponential'
const TERMINAL_CALLBACK_BACKOFF_MILLISECONDS = 60000

/**
 * Dispatches the job that posts a run's terminal callback.
 *
 * **It extends the framework's dispatcher directly, not this service's AI run one.** See the note
 * on the attempt count above: the AI run dispatcher exists to say "no automatic retry" once, for
 * the model call section 11 rules out retrying, and this is the one job in the service that must
 * do the opposite. Everything else the AI run dispatcher holds is that same option hash, so there
 * is nothing left for this class to have inherited from it.
 *
 * **The engine is named here.** One engine configures both of this repository's processes — the
 * API server that enqueues and the daemon that consumes — so naming it is how this dispatcher
 * reaches the same Redis as the worker that answers it.
 */
export default class DeliverRunCallbackJobDispatcher extends BaseJobDispatcher {
  /**
   * get: the engine this dispatcher's queue is configured from.
   *
   * @override
   * @returns {typeof AppJobEngine} - The engine.
   */
  static get EngineCtor () {
    return AppJobEngine
  }

  /**
   * get: the manifest naming this dispatcher's queue and body shape.
   *
   * @override
   * @returns {typeof DeliverRunCallbackJobManifest} - The manifest.
   */
  static get ManifestCtor () {
    return DeliverRunCallbackJobManifest
  }

  /**
   * get: the BullMQ queue options a terminal callback is produced with.
   *
   * @override
   * @returns {Partial<import('bullmq').QueueOptions>} - The queue options.
   */
  static get optionHash () {
    return {
      defaultJobOptions: {
        attempts: TERMINAL_CALLBACK_ATTEMPT_COUNT,
        backoff: {
          type: TERMINAL_CALLBACK_BACKOFF_TYPE,
          delay: TERMINAL_CALLBACK_BACKOFF_MILLISECONDS,
        },
      },
    }
  }
}
