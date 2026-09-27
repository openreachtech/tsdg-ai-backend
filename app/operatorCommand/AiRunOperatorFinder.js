import {
  Op,
} from 'sequelize'

import AiRunPageResponseBuilder from '../aiRun/AiRunPageResponseBuilder.js'

import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'
import AiRun from '../../sequelize/models/AiRun.js'
import AiRunCategory from '../../sequelize/models/AiRunCategory.js'
import AiRunStatus from '../../sequelize/models/AiRunStatus.js'
import AiRunStep from '../../sequelize/models/AiRunStep.js'
import AiRunStepCategory from '../../sequelize/models/AiRunStepCategory.js'

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

/*
 * The columns a run is read as, and the guard that no content is printed by accident.
 *
 * Section 7 names four things content — the request body, the result body, the raw model output
 * and the subject label — and section 16 forbids the command from printing any of them. A rule
 * asking the reporter not to print them would be a paragraph standing between a terminal
 * scrollback and a store of personal data, which is the arrangement `AiRunStepRecorder`'s own
 * docblock says is worth nothing. So the guard is this list: `request_body`, `result_body` and
 * `subject_label` are absent from it, and a column that never leaves the database cannot reach a
 * scrollback that has no clock.
 *
 * `ApiClientId` is absent too, and for the opposite reason. Every command reads across every
 * client, so the client is neither a condition of these reads nor a fact any of them answers
 * with; leaving the column unread is what makes that visible in the file rather than only in the
 * `where`.
 *
 * `failure_reason_code` is read, although criterion 5's list of row facts does not name it.
 * Section 16 says the command prints reason codes, and a failed-runs command that says a run
 * failed and not why sends the operator to a service that by hypothesis will not boot. The column
 * is `STRING(64)` and is a lookup key by construction — the glossary makes a reason code "a code
 * plus JSON parameters returned in place of a human sentence" — so it is a state and not a
 * message built from internals. `failure_parameters` is NOT read: section 16's list of what a
 * command prints ends at reason codes, and the parameters are the half that carries figures a
 * caller chose.
 *
 * `started_at` is read because it is the column the stall threshold is measured against for a run
 * that is going, and a threshold whose own measurement cannot be printed is one an operator has
 * to take on trust.
 */
const AI_RUN_ATTRIBUTE_NAMES = [
  'id',
  'runKey',
  'correlationId',
  'externalRef',
  'failureReasonCode',
  'acceptedAt',
  'startedAt',
  'finishedAt',
  'AiRunCategoryId',
  'AiRunStatusId',
]

/*
 * What is read off a master row: the id the run points at, and the name a row prints.
 *
 * `display_name` and `display_order` are a client surface's business and are left where they are.
 */
const AI_RUN_MASTER_ATTRIBUTE_NAMES = [
  'id',
  'name',
]

/*
 * The columns a step is read as.
 *
 * `rejections` is absent, and its absence is the point. It is not one of the four things section 7
 * counts as content, so nothing forbids reading it — but it is the decision trace, kept 730 days
 * against content's 30, and `AiRunStepRecorder` states plainly that its own shape checks cannot
 * tell `Jane-Doe-12-Elm-Street` from a field path. A column no query selects is one no reporter
 * can print, and that is a stronger guarantee than a reporter that has been asked not to.
 *
 * `id` is absent because nothing downstream addresses a step by its row id; a step is identified
 * by the run it belongs to and its place in that run.
 */
const AI_RUN_STEP_ATTRIBUTE_NAMES = [
  'AiRunId',
  'AiRunStepCategoryId',
  'stepIndex',
  'stepName',
  'outcomeCode',
  'reasonCode',
  'startedAt',
  'finishedAt',
]

/*
 * The columns a model call is read as: which run made it, and what it spent.
 *
 * `response_body` is the raw model output, which section 7 counts as content and section 16
 * forbids printing. It is never selected, so it never reaches this process at all.
 */
const AI_MODEL_CALL_ATTRIBUTE_NAMES = [
  'AiRunId',
  'inputTokenCount',
  'outputTokenCount',
]

/*
 * The newest run first, by the row's own id.
 *
 * The id is the only column of this table that never changes and never repeats, so it orders runs
 * by the instant they were accepted without ordering on a timestamp two runs could share to the
 * millisecond. The stalled and failed commands answer "what is wrong now", and the newest is what
 * an operator reads first.
 */
const NEWEST_AI_RUN_FIRST_ORDER = [
  [
    'id',
    'DESC',
  ],
]

/*
 * The earliest run first, by the same column.
 *
 * A correlation chain is the one command whose answer is a sequence rather than a worklist: the
 * runs under one business object happened in an order, and reading them backwards makes the
 * operator reconstruct it. The two orders are two constants rather than one parameter with two
 * callers, so which one a command answers in is stated where the command is written.
 */
const EARLIEST_AI_RUN_FIRST_ORDER = [
  [
    'id',
    'ASC',
  ],
]

/*
 * A run's steps in the order the run claims for them, and — where several runs were read at once —
 * grouped by the run they belong to.
 *
 * The order is `step_index` and not the order the rows were written in, so a step recorded late
 * still reads back in its own place. That is the rule `AiRunStepRecorder#findAiRunSteps()` states
 * for one run, and it is the same rule here.
 */
const AI_RUN_STEP_ORDER = [
  [
    'AiRunId',
    'ASC',
  ],
  [
    'stepIndex',
    'ASC',
  ],
]

/**
 * Finds the runs an operator command answers with, across every client.
 *
 * **Why this is not the page builder.** `AiRunPageResponseBuilder` puts `ApiClientId` first in
 * every condition it builds and takes that id from a verified signature, which is exactly right
 * for a client reading its own runs and exactly wrong here: section 16's second criterion is that
 * the CLI reads across clients, not only one. So the reads are this class's own, and the client is
 * not a condition of any of them — it is not even a column they select.
 *
 * **Why this reaches no transport layer.** Section 16's second use case is that an operator still
 * reads what the runs are doing when the service will not boot, and that only holds if nothing in
 * this chain imports `server/`. This file imports `app/` and `sequelize/models/` and nothing else,
 * as both existing builders do.
 *
 * **One definition of stalled, borrowed rather than restated.** What counts as stalled is already
 * decided in this repository — a run still queued waiting since it was accepted, or a run still
 * going since it started, past a threshold — and `AiRunPageResponseBuilder#buildStalledCondition()`
 * is where it is decided. This class asks that method for the condition instead of writing the
 * same two branches again. A second spelling of stalled would be worse than none: the API and the
 * command would answer differently about the same run and neither file would say so.
 *
 * **Which column answers "failed since".** `ai_runs` stores no instant named for the failure.
 * There is `accepted_at`, `started_at`, `finished_at`, `cancel_requested_at` and `canceled_at`, and
 * no `failed_at` — so the question has to be answered with one of the columns that exist, and the
 * choice is argued at `#buildFailedCondition()` rather than made silently.
 *
 * **Three reads a command, and never one per row.** The runs come back in one read, the steps of
 * all of them in a second, the model calls of all of them in a third. The two master rows a run
 * points at — its status and its category — are nested `include`s on the first read, because they
 * are one row each and a join costs nothing. The steps and the calls are not: they are `hasMany`,
 * and batching them into a read of their own is what `AiRunPageResponseBuilder` already does here,
 * for a reason its docblock records — `separate: true` has no other use in this repository, so its
 * behaviour under a parent `limit` would be settled by a framework internal rather than by
 * anything a reader of this file can see. What neither shape is, and what matters, is a query per
 * run.
 *
 * **What comes back is rows, not a rendering.** The three list methods answer
 * `{ aiRuns, aiRunSteps, aiModelCalls }` and the single-run method answers
 * `{ aiRun, aiRunSteps, aiModelCalls }`; turning those into the row an operator reads belongs to
 * whatever prints, and `AiRunPageResponseBuilder#buildAiRunRowResponse()` is the one assembly of
 * that row this repository has. The steps this class hands a caller differ between the two shapes,
 * deliberately: see `#findCompletedAiRunSteps()` and `#findOrderedAiRunSteps()`.
 *
 * **Nothing here writes.** Every method is a read, which is section 16's fourth criterion held by
 * construction rather than by review.
 */
export default class AiRunOperatorFinder {
  /**
   * Constructor.
   *
   * @param {AiRunOperatorFinderParams} params - Parameters.
   */
  constructor ({
    aiRunPageResponseBuilder,
  }) {
    this.aiRunPageResponseBuilder = aiRunPageResponseBuilder
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunOperatorFinder ? X : never} T, X
   * @param {AiRunOperatorFinderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunPageResponseBuilder = this.createAiRunPageResponseBuilder(),
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunPageResponseBuilder,
      })
    )
  }

  /**
   * Create the builder holding this repository's definition of a stalled run.
   *
   * @returns {AiRunPageResponseBuilder} Builder.
   */
  static createAiRunPageResponseBuilder () {
    return AiRunPageResponseBuilder.create()
  }

  /**
   * get: the run model.
   *
   * @returns {typeof AiRun} Model.
   */
  static get AiRunCtor () {
    return AiRun
  }

  /**
   * get: the run status master model.
   *
   * @returns {typeof AiRunStatus} Model.
   */
  static get AiRunStatusCtor () {
    return AiRunStatus
  }

  /**
   * get: the run category master model.
   *
   * @returns {typeof AiRunCategory} Model.
   */
  static get AiRunCategoryCtor () {
    return AiRunCategory
  }

  /**
   * get: the step model.
   *
   * @returns {typeof AiRunStep} Model.
   */
  static get AiRunStepCtor () {
    return AiRunStep
  }

  /**
   * get: the step category master model.
   *
   * @returns {typeof AiRunStepCategory} Model.
   */
  static get AiRunStepCategoryCtor () {
    return AiRunStepCategory
  }

  /**
   * get: the model call model.
   *
   * @returns {typeof AiModelCall} Model.
   */
  static get AiModelCallCtor () {
    return AiModelCall
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunOperatorFinder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunOperatorFinder} */ (this.constructor)
  }

  /**
   * Find the runs that have been where they are for longer than a threshold, across every client.
   *
   * The condition is asked of `AiRunPageResponseBuilder#buildStalledCondition()` rather than built
   * here, so there is one definition of stalled in this repository and not two. A run exactly at
   * the threshold is stalled — that method compares with `Op.lte` — and the three terminal
   * statuses are in neither of its branches, because a run that finished did not stall however
   * long it took.
   *
   * @param {{
   *   stalledForSeconds: number
   *   now: Date
   *   limit: number | null
   * }} params - Parameters.
   * @returns {Promise<FoundAiRuns>} The runs, their completed steps and their model calls.
   * @public
   */
  async findStalledAiRuns ({
    stalledForSeconds,
    now,
    limit,
  }) {
    const whereClause = this.aiRunPageResponseBuilder.buildStalledCondition({
      stalledForSeconds,
      now,
    })

    const aiRuns = await this.findAiRuns({
      whereClause,
      order: NEWEST_AI_RUN_FIRST_ORDER,
      limit,
    })

    return this.buildFoundAiRuns({
      aiRuns,
    })
  }

  /**
   * Find the runs that failed since an instant, across every client.
   *
   * @param {{
   *   failedSince: Date
   *   limit: number | null
   * }} params - Parameters.
   * @returns {Promise<FoundAiRuns>} The runs, their completed steps and their model calls.
   * @public
   */
  async findFailedAiRuns ({
    failedSince,
    limit,
  }) {
    const whereClause = this.buildFailedCondition({
      failedSince,
    })

    const aiRuns = await this.findAiRuns({
      whereClause,
      order: NEWEST_AI_RUN_FIRST_ORDER,
      limit,
    })

    return this.buildFoundAiRuns({
      aiRuns,
    })
  }

  /**
   * Find every run grouped under one correlation id, across every client.
   *
   * The match is exact and the id is never interpreted, so every run a caller grouped under one
   * business object comes back together whichever AI service produced it. Unlike the same filter
   * on the client-facing list, no client bounds it: the chain an operator is tracing is the whole
   * chain, and a run of another client under the same id is part of what went on.
   *
   * @param {{
   *   correlationId: string
   *   limit: number | null
   * }} params - Parameters.
   * @returns {Promise<FoundAiRuns>} The runs, their completed steps and their model calls.
   * @public
   */
  async findAiRunsByCorrelationId ({
    correlationId,
    limit,
  }) {
    const whereClause = {
      correlationId,
    }

    const aiRuns = await this.findAiRuns({
      whereClause,
      order: EARLIEST_AI_RUN_FIRST_ORDER,
      limit,
    })

    return this.buildFoundAiRuns({
      aiRuns,
    })
  }

  /**
   * Find one run by the key its caller holds, with its steps in order.
   *
   * The run key is unique across the table, so no client scopes this read and none is needed: a
   * key names one run or none. A key naming none answers a null run beside two empty arrays rather
   * than a null for the whole answer, so a caller reads one shape whichever happened.
   *
   * The steps are every step the run has, in order — not the completed ones the list commands get.
   * Section 16's third command is "one run with its steps in order", and a step that has begun and
   * not finished is the most interesting row on a run an operator went looking for.
   *
   * @param {{
   *   runKey: string
   * }} params - Parameters.
   * @returns {Promise<FoundAiRun>} The run, its steps in order and its model calls.
   * @public
   */
  async findAiRunByRunKey ({
    runKey,
  }) {
    const aiRun = await this.findAiRun({
      runKey,
    })

    if (aiRun === null) {
      return {
        aiRun: null,
        aiRunSteps: [],
        aiModelCalls: [],
      }
    }

    const aiRunIds = [
      aiRun.id,
    ]

    const [
      aiRunSteps,
      aiModelCalls,
    ] = await Promise.all([
      this.findOrderedAiRunSteps({
        aiRunId: aiRun.id,
      }),
      this.findAiModelCalls({
        aiRunIds,
      }),
    ])

    return {
      aiRun,
      aiRunSteps,
      aiModelCalls,
    }
  }

  /**
   * Build the condition "failed since this instant" puts on the read.
   *
   * **Which column answers "since", and why it is not the one the run was accepted at.** The
   * schema stores no instant named for the failure: `ai_runs` carries `accepted_at`, `started_at`,
   * `finished_at`, `cancel_requested_at` and `canceled_at`, and no `failed_at`. Of the two
   * candidates, `finished_at` is the instant a run reached failed and not an approximation of it —
   * `AiRunStatusRecorder` lists `finishedAt` among the fields a move to failed is evidenced by and
   * refuses the transition when it is not stated, so every failed row carries the instant it
   * settled, written by the same call that set the status.
   *
   * `accepted_at` answers a different question. It would return a run accepted on Monday that
   * failed on Friday when the operator asked about Thursday, and hide a run accepted last month
   * that failed a minute ago — which is the run the command was opened for. An operator asking
   * "what has failed since the deploy" is asking about the failing, not about the accepting.
   *
   * The bound is `Op.gte`, so a run whose `finished_at` is exactly the stated instant is in the
   * answer. A threshold an operator read off a log line and pasted back in must include the run
   * that produced it.
   *
   * @param {{
   *   failedSince: Date
   * }} params - Parameters.
   * @returns {object} The condition.
   * @public
   */
  buildFailedCondition ({
    failedSince,
  }) {
    return {
      AiRunStatusId: AI_RUN_STATUS.FAILED.ID,
      finishedAt: {
        [Op.gte]: failedSince,
      },
    }
  }

  /**
   * Find the runs a condition names, across every client.
   *
   * @param {{
   *   whereClause: object
   *   order: Array<Array<string>>
   *   limit: number | null
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The runs.
   * @public
   */
  async findAiRuns ({
    whereClause,
    order,
    limit,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findAll({
        where: whereClause,
        attributes: AI_RUN_ATTRIBUTE_NAMES,
        include: this.buildAiRunMasterIncludes(),
        order,
        ...this.buildLimitOption({
          limit,
        }),
      })
    )
  }

  /**
   * Find one run by its key, across every client.
   *
   * @param {{
   *   runKey: string
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when no run carries that key.
   * @public
   */
  async findAiRun ({
    runKey,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          runKey,
        },
        attributes: AI_RUN_ATTRIBUTE_NAMES,
        include: this.buildAiRunMasterIncludes(),
      })
    )
  }

  /**
   * Build the two master rows a run is read with.
   *
   * A run's status and its category are one row each, so they are joined onto the read rather than
   * looked up afterwards: an operator reads the name and never the id, and a second read to turn
   * one into the other is a read nobody needs.
   *
   * @returns {Array<object>} The includes.
   * @public
   */
  buildAiRunMasterIncludes () {
    return [
      {
        model: this.Ctor.AiRunStatusCtor,
        attributes: AI_RUN_MASTER_ATTRIBUTE_NAMES,
      },
      {
        model: this.Ctor.AiRunCategoryCtor,
        attributes: AI_RUN_MASTER_ATTRIBUTE_NAMES,
      },
    ]
  }

  /**
   * Build how many runs a read is bounded to, if it is bounded at all.
   *
   * A limit that is not a number bounds nothing, and the read answers every run its condition
   * names. That is the right way round for a command: the operator stated the bound, the command
   * layer validated what they stated, and a finder that invented one of its own would hide runs
   * from somebody who asked for all of them — while saying nothing about having done so.
   *
   * @param {{
   *   limit: number | null
   * }} params - Parameters.
   * @returns {object} The option, empty when the read is unbounded.
   * @public
   */
  buildLimitOption ({
    limit,
  }) {
    if (typeof limit !== 'number') {
      return {}
    }

    return {
      limit,
    }
  }

  /**
   * Build the answer a list command reads, out of the runs its condition found.
   *
   * The two reads need nothing from one another, so they are issued together rather than one after
   * the next.
   *
   * @param {{
   *   aiRuns: Array<*>
   * }} params - Parameters.
   * @returns {Promise<FoundAiRuns>} The runs, their completed steps and their model calls.
   * @public
   */
  async buildFoundAiRuns ({
    aiRuns,
  }) {
    const aiRunIds = aiRuns.map(it => it.id)

    const [
      aiRunSteps,
      aiModelCalls,
    ] = await Promise.all([
      this.findCompletedAiRunSteps({
        aiRunIds,
      }),
      this.findAiModelCalls({
        aiRunIds,
      }),
    ])

    return {
      aiRuns,
      aiRunSteps,
      aiModelCalls,
    }
  }

  /**
   * Find every step these runs have finished.
   *
   * **Why a list command gets only the finished ones.** A row says how far a run got, and how far
   * a run got is the furthest step it *completed* — a step that has begun is not one it got past.
   * The condition is the one `AiRunPageResponseBuilder#findCompletedAiRunSteps()` applies for
   * exactly that reason, and it is applied here so that the row a terminal prints and the row a
   * client reads say the same thing about the same run. Filtering after the read would leave the
   * same answer resting on whoever reads the rows instead of on the query.
   *
   * @param {{
   *   aiRunIds: Array<number>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The steps.
   * @public
   */
  async findCompletedAiRunSteps ({
    aiRunIds,
  }) {
    if (aiRunIds.length === 0) {
      return []
    }

    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.findAll({
        where: {
          AiRunId: {
            [Op.in]: aiRunIds,
          },
          finishedAt: {
            [Op.ne]: null,
          },
        },
        attributes: AI_RUN_STEP_ATTRIBUTE_NAMES,
        include: [
          {
            model: this.Ctor.AiRunStepCategoryCtor,
            attributes: AI_RUN_MASTER_ATTRIBUTE_NAMES,
          },
        ],
        order: AI_RUN_STEP_ORDER,
      })
    )
  }

  /**
   * Find every step one run has, in the order it ran them.
   *
   * **Why this is not `AiRunStepRecorder#findAiRunSteps()`, which asks the same question.** That
   * method answers it, and its ordering rule is the one repeated here — but it names no
   * `attributes`, so it reads every column of `ai_run_steps`, `rejections` among them.
   * `rejections` is the decision trace, kept 730 days against content's 30, and the recorder's own
   * docblock records that its shape checks cannot tell a person's name joined by hyphens from a
   * field path. Section 16 holds this command stricter than any API caller precisely because a
   * scrollback has no clock at all, and the only way to hold it is to not select the column:
   * asking the reporter not to print it is the paragraph that recorder says is worth nothing.
   * Narrowing the recorder instead was not open — it is the run-record surface's, and this unit
   * does not edit it.
   *
   * The other half of the reuse did not fit at all: that method takes one run, and the three list
   * commands read many, so calling it would be a query per run.
   *
   * @param {{
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The run's steps, earliest first.
   * @public
   */
  async findOrderedAiRunSteps ({
    aiRunId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunStepCtor.findAll({
        where: {
          AiRunId: aiRunId,
        },
        attributes: AI_RUN_STEP_ATTRIBUTE_NAMES,
        include: [
          {
            model: this.Ctor.AiRunStepCategoryCtor,
            attributes: AI_RUN_MASTER_ATTRIBUTE_NAMES,
          },
        ],
        order: AI_RUN_STEP_ORDER,
      })
    )
  }

  /**
   * Find every model call these runs made.
   *
   * Three columns: which run made the call, and what it spent either way. The response body is the
   * raw model output, which section 16 forbids printing, and it is left in the database rather
   * than read and then not printed.
   *
   * @param {{
   *   aiRunIds: Array<number>
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The model calls.
   * @public
   */
  async findAiModelCalls ({
    aiRunIds,
  }) {
    if (aiRunIds.length === 0) {
      return []
    }

    return /** @type {*} */ (
      this.Ctor.AiModelCallCtor.findAll({
        where: {
          AiRunId: {
            [Op.in]: aiRunIds,
          },
        },
        attributes: AI_MODEL_CALL_ATTRIBUTE_NAMES,
      })
    )
  }
}

/**
 * @typedef {{
 *   aiRunPageResponseBuilder: AiRunPageResponseBuilder
 * }} AiRunOperatorFinderParams
 */

/**
 * @typedef {Partial<AiRunOperatorFinderParams>} AiRunOperatorFinderFactoryParams
 */

/**
 * What a list command reads: the runs, the steps they completed, and the calls they made. The two
 * arrays are flat across every run found, and not grouped by run.
 *
 * @typedef {{
 *   aiRuns: Array<*>
 *   aiRunSteps: Array<*>
 *   aiModelCalls: Array<*>
 * }} FoundAiRuns
 */

/**
 * What the single-run command reads. `aiRun` is null when no run carries the key, and the two
 * arrays are then empty rather than absent.
 *
 * @typedef {{
 *   aiRun: * | null
 *   aiRunSteps: Array<*>
 *   aiModelCalls: Array<*>
 * }} FoundAiRun
 */
