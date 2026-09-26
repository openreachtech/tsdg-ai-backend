import {
  Op,
} from 'sequelize'

import AiRunPageCursor from './AiRunPageCursor.js'

import AI_RUN_CATEGORY_CONSTANT_HASH from '../constants/aiRunCategoryConstants.js'
import AI_RUN_PAGE_CONSTANT_HASH from '../constants/aiRunPageConstants.js'
import AI_RUN_STATUS_CONSTANT_HASH from '../constants/aiRunStatusConstants.js'

import AiModelCall from '../../sequelize/models/AiModelCall.js'
import AiRun from '../../sequelize/models/AiRun.js'
import AiRunCategory from '../../sequelize/models/AiRunCategory.js'
import AiRunStatus from '../../sequelize/models/AiRunStatus.js'
import AiRunStep from '../../sequelize/models/AiRunStep.js'

const {
  AI_RUN_CATEGORY,
} = AI_RUN_CATEGORY_CONSTANT_HASH

const {
  AI_RUN_PAGE,
} = AI_RUN_PAGE_CONSTANT_HASH

const {
  AI_RUN_STATUS,
} = AI_RUN_STATUS_CONSTANT_HASH

const MILLISECOND_COUNT_PER_SECOND = 1000

/**
 * Builds one page of a client's own runs, and the row each run reads as.
 *
 * **Why the row is built here and not in the renderer.** `#operator-cli` requires that a row the
 * CLI prints carries the same facts a list row carries — the subject, the kind, the status, the
 * elapsed time and the token spend. A row assembled inside a renderer would be reachable only by
 * an HTTP request, so the CLI would grow a second assembly of the same facts and the two would
 * drift. `#buildAiRunRowResponse()` takes a run, the step it last finished, the calls it made and
 * an instant, and returns the row — no request, no database, nothing of HTTP in it.
 *
 * **Three queries a page, whatever the page holds.** The runs come back in one read; the steps
 * that completed for all of them in a second; the model calls for all of them in a third. Each of
 * the three is bounded by the page — a run has six steps and three model calls at the most, so
 * the largest page this route answers reads at most a hundred runs, six hundred steps and three
 * hundred calls. What this deliberately is not is a query per row: the last completed step and
 * the token spend are per-run facts read for a page of runs, and asked one run at a time a page
 * of fifty would be a hundred and one queries.
 *
 * **What was rejected, and why.** A SQL aggregate — `COUNT` and `SUM` grouped by the run — would
 * return one row per run instead of one per call, and is the obvious shape. It is not used here:
 * MariaDB answers `SUM()` over an integer column as a `DECIMAL`, which the driver hands back as a
 * string, while the SQLite the local suite runs on answers a number. The token spend would be a
 * number in every test and a string on the wire, and nothing in this repository would have said
 * so — the same dialect trap `AiRunResponseBuilder` records for `DECIMAL` columns. Summing three
 * integers in the application costs nothing and has one answer everywhere. An `include` carrying
 * `separate: true` was the other candidate, and reads as well; it was passed over because this
 * repository has no other use of it, so its behaviour under a parent `limit` would be settled by
 * a framework internal rather than by anything a reader of this file can see.
 *
 * **Content never crosses this surface.** `#findAiRuns()` names the columns it wants, and neither
 * `request_body` nor `result_body` is among them. Both are `MEDIUMTEXT`: a hundred runs read with
 * their stored bodies would be an answer measured in megabytes to a question about how far along
 * some work is.
 *
 * **A run of another client is never loaded.** The client id is the first condition of the read
 * and is taken from the caller, which takes it from the resolved signature — there is no request
 * parameter that reaches it. A cursor is resolved under the same scope, so a cursor naming
 * somebody else's run resolves to nothing and is refused exactly as a fabricated one is.
 */
export default class AiRunPageResponseBuilder {
  /**
   * Constructor.
   *
   * @param {AiRunPageResponseBuilderParams} params - Parameters.
   */
  constructor ({
    aiRunPageCursorFactory,
  }) {
    this.aiRunPageCursorFactory = aiRunPageCursorFactory
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunPageResponseBuilder ? X : never} T, X
   * @param {AiRunPageResponseBuilderFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunPageCursorFactory = AiRunPageCursor,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunPageCursorFactory,
      })
    )
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
   * get: the model call model.
   *
   * @returns {typeof AiModelCall} Model.
   */
  static get AiModelCallCtor () {
    return AiModelCall
  }

  /**
   * Extract the id of the status a name names.
   *
   * A name naming no status answers null, and the condition built from it then matches no run at
   * all. That is the safe direction of the two: the validator refuses such a name before this is
   * reached, and were it ever reached, a filter nobody has is better answered with no runs than
   * with every run the client owns.
   *
   * @param {{
   *   statusName: string
   * }} params - Parameters.
   * @returns {number | null} The id, or null when no status carries that name.
   * @public
   */
  static extractAiRunStatusId ({
    statusName,
  }) {
    const aiRunStatus = Object.values(AI_RUN_STATUS)
      .find(it => it.NAME === statusName)

    return aiRunStatus?.ID
      ?? null
  }

  /**
   * Extract the id of the category a name names.
   *
   * @param {{
   *   runCategoryName: string
   * }} params - Parameters.
   * @returns {number | null} The id, or null when no category carries that name.
   * @public
   */
  static extractAiRunCategoryId ({
    runCategoryName,
  }) {
    const aiRunCategory = Object.values(AI_RUN_CATEGORY)
      .find(it => it.NAME === runCategoryName)

    return aiRunCategory?.ID
      ?? null
  }

  /**
   * Check whether two values name the same run.
   *
   * Both are `BIGINT` columns, and a dialect answers a `BIGINT` as a number or as a string
   * depending on which dialect it is — the SQLite the local suite runs on says number, MariaDB
   * says string. Comparing the text of the two is the one comparison that holds either way, and
   * it costs nothing at the sizes a page reaches.
   *
   * @param {{
   *   first: number | string
   *   second: number | string
   * }} params - Parameters.
   * @returns {boolean} true: the two name the same run.
   * @public
   */
  static isSameAiRunId ({
    first,
    second,
  }) {
    return String(first) === String(second)
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunPageResponseBuilder} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunPageResponseBuilder} */ (this.constructor)
  }

  /**
   * Build the body one page of runs is answered with.
   *
   * @param {{
   *   apiClientId: number
   *   input: restfulapi.v1.AiRunsQueryInput
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<restfulapi.v1.AiRunsResponse | null>} The body, or null when the cursor
   * names no run of this client.
   * @public
   */
  async buildAiRunsResponse ({
    apiClientId,
    input,
    now,
  }) {
    const cursorCondition = await this.buildCursorCondition({
      cursor: input.cursor,
      apiClientId,
    })

    if (cursorCondition === null) {
      return null
    }

    const runCount = this.extractRunCount({
      limit: input.limit,
    })

    const whereClause = this.buildWhereClause({
      apiClientId,
      input,
      now,
      cursorCondition,
    })

    const aiRuns = await this.findAiRuns({
      whereClause,
      runCount,
    })

    return this.buildFoundAiRunsResponse({
      aiRuns,
      runCount,
      now,
    })
  }

  /**
   * Build the condition that puts the page after the run a cursor names.
   *
   * The three answers are three different things and are kept apart. No cursor is an empty
   * condition — the page starts at the newest run. A cursor naming a run of this client is a
   * condition on the row's own id, which is an immutable, monotonic stand-in for the order runs
   * were accepted in; that is what makes a page stable while runs change status, because nothing
   * a run does to itself moves it in that order. A cursor naming no run of this client is null,
   * and the caller turns it into the one refusal this route answers a bad cursor with.
   *
   * @param {{
   *   cursor: string | null
   *   apiClientId: number
   * }} params - Parameters.
   * @returns {Promise<object | null>} The condition — empty when no cursor was sent — or null
   * when the cursor names no run of this client.
   * @public
   */
  async buildCursorCondition ({
    cursor,
    apiClientId,
  }) {
    if (cursor === null) {
      return {}
    }

    const runKey = this.aiRunPageCursorFactory.extractRunKey({
      cursorText: cursor,
    })

    const cursorAiRun = await this.findCursorAiRun({
      runKey,
      apiClientId,
    })

    if (cursorAiRun === null) {
      return null
    }

    return {
      id: {
        [Op.lt]: cursorAiRun.id,
      },
    }
  }

  /**
   * Find the run a cursor names, scoped to the client that sent it.
   *
   * Only the id is read, because the id is the whole of what the condition needs. The client is
   * part of the condition rather than something checked after the row came back, so a cursor
   * carrying another client's run key finds nothing here and is answered exactly as a fabricated
   * cursor is.
   *
   * @param {{
   *   runKey: string | null
   *   apiClientId: number
   * }} params - Parameters.
   * @returns {Promise<*>} The run, or null when this client has no run under that key.
   * @public
   */
  async findCursorAiRun ({
    runKey,
    apiClientId,
  }) {
    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findOne({
        where: {
          runKey,
          ApiClientId: apiClientId,
        },
        attributes: [
          'id',
        ],
      })
    )
  }

  /**
   * Extract how many runs this page holds.
   *
   * @param {{
   *   limit: number | null
   * }} params - Parameters.
   * @returns {number} The count.
   * @public
   */
  extractRunCount ({
    limit,
  }) {
    return limit
      ?? AI_RUN_PAGE.DEFAULT_RUN_COUNT
  }

  /**
   * Build the condition this page's runs are read under.
   *
   * The client comes first and is never optional; every other condition is a filter the caller
   * stated, and a filter nobody stated contributes nothing rather than contributing a condition
   * that matches everything. Each is built by its own method so that a filter added later is a
   * method added here and a line added to this object — and not an edit to a condition that
   * already works.
   *
   * @param {{
   *   apiClientId: number
   *   input: restfulapi.v1.AiRunsQueryInput
   *   now: Date
   *   cursorCondition: object
   * }} params - Parameters.
   * @returns {object} The condition.
   * @public
   */
  buildWhereClause ({
    apiClientId,
    input,
    now,
    cursorCondition,
  }) {
    return {
      ApiClientId: apiClientId,
      ...this.buildAiRunStatusCondition({
        statusName: input.statusName,
      }),
      ...this.buildAiRunCategoryCondition({
        runCategoryName: input.runCategoryName,
      }),
      ...this.buildCorrelationIdCondition({
        correlationId: input.correlationId,
      }),
      ...this.buildStalledCondition({
        stalledForSeconds: input.stalledForSeconds,
        now,
      }),
      ...cursorCondition,
    }
  }

  /**
   * Build the condition a status filter puts on the read.
   *
   * @param {{
   *   statusName: *
   * }} params - Parameters.
   * @returns {object} The condition, empty when no status was asked for.
   * @public
   */
  buildAiRunStatusCondition ({
    statusName,
  }) {
    if (statusName === null) {
      return {}
    }

    const aiRunStatusId = this.Ctor.extractAiRunStatusId({
      statusName,
    })

    return {
      AiRunStatusId: aiRunStatusId,
    }
  }

  /**
   * Build the condition a category filter puts on the read.
   *
   * @param {{
   *   runCategoryName: *
   * }} params - Parameters.
   * @returns {object} The condition, empty when no category was asked for.
   * @public
   */
  buildAiRunCategoryCondition ({
    runCategoryName,
  }) {
    if (runCategoryName === null) {
      return {}
    }

    const aiRunCategoryId = this.Ctor.extractAiRunCategoryId({
      runCategoryName,
    })

    return {
      AiRunCategoryId: aiRunCategoryId,
    }
  }

  /**
   * Build the condition a correlation filter puts on the read.
   *
   * The match is exact and the id is never interpreted, so every run a caller grouped under one
   * business object comes back together whichever AI service produced it — the category is a
   * column of the same row and is not part of this condition.
   *
   * @param {{
   *   correlationId: *
   * }} params - Parameters.
   * @returns {object} The condition, empty when no correlation id was asked for.
   * @public
   */
  buildCorrelationIdCondition ({
    correlationId,
  }) {
    if (correlationId === null) {
      return {}
    }

    return {
      correlationId,
    }
  }

  /**
   * Build the condition a stall threshold puts on the read.
   *
   * **A stalled run is one that has not settled and has been where it is for too long, and there
   * are two of those.** A run still queued has been waiting since it was accepted — nothing has
   * picked it up, which is the failure an operator most wants to find. A run still going has been
   * going since it started. The two are written as two branches rather than as one condition over
   * whichever timestamp happens to be set, because each branch names the status it is about and
   * the timestamp that belongs to it, and a reader never has to work out which column a run falls
   * under. The three terminal statuses appear in neither branch: a run that has finished did not
   * stall, however long it took.
   *
   * @param {{
   *   stalledForSeconds: number | null
   *   now: Date
   * }} params - Parameters.
   * @returns {object} The condition, empty when no threshold was asked for.
   * @public
   */
  buildStalledCondition ({
    stalledForSeconds,
    now,
  }) {
    if (stalledForSeconds === null) {
      return {}
    }

    const stalledSince = this.generateStalledSince({
      stalledForSeconds,
      now,
    })

    return {
      [Op.or]: [
        {
          AiRunStatusId: AI_RUN_STATUS.QUEUED.ID,
          acceptedAt: {
            [Op.lte]: stalledSince,
          },
        },
        {
          AiRunStatusId: AI_RUN_STATUS.RUNNING.ID,
          startedAt: {
            [Op.lte]: stalledSince,
          },
        },
      ],
    }
  }

  /**
   * Generate the instant a stalled run must have been waiting since.
   *
   * @param {{
   *   stalledForSeconds: number
   *   now: Date
   * }} params - Parameters.
   * @returns {Date} The instant.
   * @public
   */
  generateStalledSince ({
    stalledForSeconds,
    now,
  }) {
    const stalledMillisecondCount = stalledForSeconds * MILLISECOND_COUNT_PER_SECOND

    return new Date(now.getTime() - stalledMillisecondCount)
  }

  /**
   * Find this page's runs, and one more.
   *
   * **One more than the page holds is what answers "is there another page".** A page read at
   * exactly its own size says nothing: a page that came back full may be the last one. Reading
   * one extra row settles it without a second count over the same condition, and the extra row is
   * dropped rather than answered with.
   *
   * **The order is the row's own id, descending.** It is the only column this table has that
   * never changes and never repeats, which is what a cursor needs: a run changing status does not
   * move in it, and no two runs share a place. It is also the order runs were accepted in, since
   * the id is assigned as the run is stored, so the newest run is the first row without ordering
   * by a timestamp that two runs could share to the millisecond.
   *
   * @param {{
   *   whereClause: object
   *   runCount: number
   * }} params - Parameters.
   * @returns {Promise<Array<*>>} The runs.
   * @public
   */
  async findAiRuns ({
    whereClause,
    runCount,
  }) {
    const probedRunCount = runCount + 1

    return /** @type {*} */ (
      this.Ctor.AiRunCtor.findAll({
        where: whereClause,
        attributes: [
          'id',
          'runKey',
          'subjectLabel',
          'correlationId',
          'externalRef',
          'acceptedAt',
          'finishedAt',
          'AiRunCategoryId',
          'AiRunStatusId',
        ],
        include: [
          {
            model: this.Ctor.AiRunStatusCtor,
            attributes: [
              'id',
              'name',
            ],
          },
          {
            model: this.Ctor.AiRunCategoryCtor,
            attributes: [
              'id',
              'name',
            ],
          },
        ],
        order: [
          ['id', 'DESC'],
        ],
        limit: probedRunCount,
      })
    )
  }

  /**
   * Build the body of a page whose runs have been read.
   *
   * The two reads are independent of one another, so they are issued together rather than one
   * after the next: neither needs a value the other produced.
   *
   * @param {{
   *   aiRuns: Array<*>
   *   runCount: number
   *   now: Date
   * }} params - Parameters.
   * @returns {Promise<restfulapi.v1.AiRunsResponse>} The body.
   * @public
   */
  async buildFoundAiRunsResponse ({
    aiRuns,
    runCount,
    now,
  }) {
    const pagedAiRuns = aiRuns.slice(0, runCount)

    const aiRunIds = pagedAiRuns.map(it => it.id)

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

    const runs = pagedAiRuns.map(it =>
      this.buildAiRunRowResponse({
        aiRun: it,
        aiRunSteps,
        aiModelCalls,
        now,
      })
    )

    const nextCursor = this.generateNextCursor({
      aiRuns,
      runCount,
    })

    return {
      runs,
      nextCursor,
    }
  }

  /**
   * Find every step these runs have finished.
   *
   * A step still open is left out by the condition rather than by whatever reads the rows, so
   * "the last step that completed" is answered by the furthest row that came back and never by a
   * row that has only begun. Four columns are read: the run each step belongs to, its place in
   * that run's order, what it was called, and the instant it finished — never `rejections`, which
   * is the internal decision trace and is on no client surface.
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
        attributes: [
          'AiRunId',
          'stepIndex',
          'stepName',
          'finishedAt',
        ],
      })
    )
  }

  /**
   * Find every model call these runs have made.
   *
   * A canceled run's calls are the ones it made before it stopped: nothing was recorded after the
   * stop, so what it spent up to the stop is a read rather than a calculation.
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
        attributes: [
          'AiRunId',
          'inputTokenCount',
          'outputTokenCount',
        ],
      })
    )
  }

  /**
   * Build the row one run reads as.
   *
   * **This is the method `#operator-cli` reuses.** It takes a run, the steps and model calls its
   * page read, and the instant the request was stamped with, and returns the row — there is
   * nothing of HTTP in it and it reads no table, so a terminal prints the same facts a client
   * reads without a second assembly of them existing anywhere.
   *
   * The two arrays are the whole page's and not this run's, and this method picks its own out of
   * them. That is what keeps the page to three queries: the steps and calls of every run on the
   * page are read once between them, and a row that asked for its own would be asking one run at
   * a time. A caller holding one run's rows passes those, and nothing about the answer changes.
   *
   * @param {{
   *   aiRun: *
   *   aiRunSteps: Array<*>
   *   aiModelCalls: Array<*>
   *   now: Date
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunRowResponse} The row.
   * @public
   */
  buildAiRunRowResponse ({
    aiRun,
    aiRunSteps,
    aiModelCalls,
    now,
  }) {
    const lastCompletedAiRunStep = this.extractLastCompletedAiRunStep({
      aiRunSteps,
      aiRunId: aiRun.id,
    })

    const lastCompletedStep = this.buildLastCompletedStepResponse({
      aiRunStep: lastCompletedAiRunStep,
    })

    const ownAiModelCalls = this.extractOwnAiModelCalls({
      aiModelCalls,
      aiRunId: aiRun.id,
    })

    const elapsedSeconds = this.generateElapsedSeconds({
      aiRun,
      now,
    })

    const modelCallCount = ownAiModelCalls.length

    const inputTokenCount = this.generateInputTokenCount({
      aiModelCalls: ownAiModelCalls,
    })

    const outputTokenCount = this.generateOutputTokenCount({
      aiModelCalls: ownAiModelCalls,
    })

    return {
      runKey: aiRun.runKey,
      runCategoryName: aiRun.AiRunCategory.name,
      subjectLabel: aiRun.subjectLabel,
      correlationId: aiRun.correlationId,
      externalRef: aiRun.externalRef,
      statusName: aiRun.AiRunStatus.name,
      lastCompletedStep,
      elapsedSeconds,
      modelCallCount,
      inputTokenCount,
      outputTokenCount,
      acceptedAt: aiRun.acceptedAt,
    }
  }

  /**
   * Extract the furthest step one run has finished.
   *
   * @param {{
   *   aiRunSteps: Array<*>
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {*} The step, or null when this run has finished none.
   * @public
   */
  extractLastCompletedAiRunStep ({
    aiRunSteps,
    aiRunId,
  }) {
    const ownAiRunSteps = aiRunSteps.filter(it =>
      this.Ctor.isSameAiRunId({
        first: it.AiRunId,
        second: aiRunId,
      })
    )

    return ownAiRunSteps.reduce(
      (furthestAiRunStep, aiRunStep) =>
        this.chooseFurtherAiRunStep({
          first: furthestAiRunStep,
          second: aiRunStep,
        }),
      null
    )
  }

  /**
   * Choose whichever of two steps ran later in its run.
   *
   * @param {{
   *   first: *
   *   second: *
   * }} params - Parameters.
   * @returns {*} The later step.
   * @public
   */
  chooseFurtherAiRunStep ({
    first,
    second,
  }) {
    if (first === null) {
      return second
    }

    if (first.stepIndex > second.stepIndex) {
      return first
    }

    return second
  }

  /**
   * Extract the model calls one run made.
   *
   * @param {{
   *   aiModelCalls: Array<*>
   *   aiRunId: number
   * }} params - Parameters.
   * @returns {Array<*>} The model calls of that run.
   * @public
   */
  extractOwnAiModelCalls ({
    aiModelCalls,
    aiRunId,
  }) {
    return aiModelCalls.filter(it =>
      this.Ctor.isSameAiRunId({
        first: it.AiRunId,
        second: aiRunId,
      })
    )
  }

  /**
   * Build how far a run got, as a row states it.
   *
   * Two fields and not the seven the step trace carries: a row says how far a run got, and
   * `GET /v1/ai-runs/:runKey?expand=steps` says the rest. A run that has finished no step answers
   * null rather than a row of nulls, because "no step has completed" is one fact and not two
   * missing ones.
   *
   * @param {{
   *   aiRunStep: *
   * }} params - Parameters.
   * @returns {restfulapi.v1.AiRunLastCompletedStepResponse | null} The step, or null.
   * @public
   */
  buildLastCompletedStepResponse ({
    aiRunStep,
  }) {
    if (aiRunStep === null) {
      return null
    }

    return {
      stepName: aiRunStep.stepName,
      stepIndex: aiRunStep.stepIndex,
    }
  }

  /**
   * Generate how long a run has taken, in whole seconds.
   *
   * It is measured from the instant the run was accepted, because that is the only instant every
   * run has: a run still queued has no start, and a field that answered null for the runs a
   * caller is waiting on would be missing exactly when it is wanted. It ends at the instant the
   * run ended, or at the instant this request was stamped with while it has not.
   *
   * The floor at zero is against a clock and not against a caller. `acceptedAt` was written by
   * whichever machine accepted the run and `now` was stamped by whichever machine is answering
   * this request; two machines a few milliseconds apart would otherwise make a run that has just
   * been accepted report a negative age, which is not a thing a client should have to read.
   *
   * @param {{
   *   aiRun: *
   *   now: Date
   * }} params - Parameters.
   * @returns {number} The count of seconds.
   * @public
   */
  generateElapsedSeconds ({
    aiRun,
    now,
  }) {
    const endedAt = aiRun.finishedAt
      ?? now

    const elapsedMillisecondCount = endedAt.getTime() - aiRun.acceptedAt.getTime()

    const elapsedSecondCount = Math.floor(elapsedMillisecondCount / MILLISECOND_COUNT_PER_SECOND)

    return Math.max(0, elapsedSecondCount)
  }

  /**
   * Generate what a run has spent in input tokens.
   *
   * A run that has called no model spends zero, which is a fact about the run — a null would say
   * the figure is unknown, and it is not.
   *
   * @param {{
   *   aiModelCalls: Array<*>
   * }} params - Parameters.
   * @returns {number} The count of tokens.
   * @public
   */
  generateInputTokenCount ({
    aiModelCalls,
  }) {
    return aiModelCalls.reduce(
      (accumulatedTokenCount, aiModelCall) => accumulatedTokenCount + aiModelCall.inputTokenCount,
      0
    )
  }

  /**
   * Generate what a run has spent in output tokens.
   *
   * Counted apart from the input tokens rather than added to them: every provider prices the two
   * differently, so a single figure would hide which half a run spent its cost on. A run that has
   * called no model spends zero, for the reason its sibling above states.
   *
   * @param {{
   *   aiModelCalls: Array<*>
   * }} params - Parameters.
   * @returns {number} The count of tokens.
   * @public
   */
  generateOutputTokenCount ({
    aiModelCalls,
  }) {
    return aiModelCalls.reduce(
      (accumulatedTokenCount, aiModelCall) => accumulatedTokenCount + aiModelCall.outputTokenCount,
      0
    )
  }

  /**
   * Generate how the page after this one is asked for.
   *
   * The extra row read by `#findAiRuns()` is the whole of the answer: it came back, so there is
   * another page, and the cursor names the last run this page actually carries. Nothing else is
   * counted, and a page that came back exactly full with nothing behind it answers null — which
   * is what lets a client walk until it reads null rather than comparing lengths.
   *
   * @param {{
   *   aiRuns: Array<*>
   *   runCount: number
   * }} params - Parameters.
   * @returns {string | null} The cursor, or null when this is the last page.
   * @public
   */
  generateNextCursor ({
    aiRuns,
    runCount,
  }) {
    if (aiRuns.length <= runCount) {
      return null
    }

    const lastAiRun = aiRuns[runCount - 1]

    const aiRunPageCursor = this.aiRunPageCursorFactory.create({
      runKey: lastAiRun.runKey,
    })

    return aiRunPageCursor.generateCursorText()
  }
}

/**
 * @typedef {{
 *   aiRunPageCursorFactory: typeof AiRunPageCursor
 * }} AiRunPageResponseBuilderParams
 */

/**
 * @typedef {Partial<AiRunPageResponseBuilderParams>} AiRunPageResponseBuilderFactoryParams
 */
