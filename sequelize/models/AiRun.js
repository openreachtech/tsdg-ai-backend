import {
  Op,
} from 'sequelize'

import {
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

import AiRunKeyInspector from '../../app/aiRun/AiRunKeyInspector.js'
import AiRunTerminalStatusInspector from '../../app/aiRun/AiRunTerminalStatusInspector.js'

const AI_RUN_STATUS_ATTRIBUTE_NAME = 'AiRunStatusId'

const REFUSED_SETTLED_TRANSITION_MESSAGE = 'AiRun refuses a move out of a status a run never leaves'

/*
 * The message says the rule as it stands, not as it once stood.
 *
 * It read "refused when it writes AiRunStatusId" while that was the whole rule, and then "unless
 * its where excludes every terminal status" while the guard read the caller's condition object.
 * Neither is the rule now: what is accepted is a `where` that compiles to the one condition this
 * model builds for a single unsettled run, and the write is then made under that condition. A
 * refusal naming a rule other than the one it applies would send a reader looking for a defect in
 * the wrong place.
 *
 * It said "writing AiRunStatusId" up to the round that found `AiRun.update({ ai_run_status_id: 2 },
 * { where: { id }, fields: ['ai_run_status_id'], validate: false })` walking a canceled run back to
 * running: the rule named one of the status's two names while the trigger compared against that
 * one name, and a caller spelling the other was neither refused nor mentioned by the refusal. It
 * says "the run status" now, because which of its names a key wears is no longer part of the rule.
 */
const REFUSED_BULK_STATUS_UPDATE_MESSAGE = 'AiRun.update() writing the run status is refused unless its where compiles to the condition this model builds for one unsettled run. Move the run through AiRunStatusRecorder.'

/*
 * The message for a key this model declares no attribute for, refused before any rule about the
 * status is reached.
 *
 * It names no key. The keys of a bulk update's values are whatever text the caller put there, and
 * the one thing this feature keeps out of a log is a caller's text — the same reason
 * `#generateEmittedWherePredicate()` answers null rather than raising the compiler's message. What
 * the refusal gives instead is the rule and the way out of it, and the key is in front of whoever
 * wrote the call.
 */
const REFUSED_UNKNOWN_BULK_FIELD_MESSAGE = 'AiRun.update() is refused when its values name a key this model declares no attribute for. Such a key reaches the SET clause as written, past every guard that asks this model what a key means. Write the attribute names this model declares.'

/**
 * AiRun model
 *
 * **A run never leaves succeeded, failed or canceled.** That is the first acceptance criterion of
 * `#run-record`, and `AiRunStatusRecorder` is where the application enforces it. `setupHooks()`
 * enforces the same rule at the row, so that a caller reaching this table without going through
 * that class cannot quietly undo it. The two are not a duplication: the recorder refuses **every**
 * write against a settled run, because a caller that reached it was asking to record a transition;
 * the model refuses only a **status move out of** a terminal status, because a settled run is still
 * written to for reasons that are not transitions — the content purge stamps `content_purged_at` on
 * runs that finished long ago, and a guard that refused that would break the retention promise
 * instead of keeping it.
 *
 * **What the two hooks each close, and why there are two.** `beforeUpdate` sees the row, so it can
 * compare the status being written against the one the row already carries; it is reached by
 * `instance.save()`, by `instance.update()`, and by `Model.update()` when the caller passes
 * `individualHooks`. `Model.update()` on its own reaches `beforeBulkUpdate` only
 * (`sequelize/lib/model.js`, `update()`: `individualHooks` defaults to false and the per-row hooks
 * live inside that branch), and at that point no row has been read, so nothing there can judge a
 * status against the one it would replace. A bulk update whose every key this model resolves to an
 * attribute other than the status still runs — it cannot move a status it does not write.
 *
 * **Which of the values name the status is asked of the model, not of a string.** A column has two
 * names here — the attribute `AiRunStatusId` that this model declares and the field
 * `ai_run_status_id` that the table carries — and Sequelize 6.37.8 does not choose between them
 * before the bulk hook runs: `Model.update()` hands the hook the caller's own keys and maps
 * attribute names to column names afterwards, through `Utils.mapValueFieldNames()`, which passes a
 * key it does not recognise through into the `SET` clause as written. So a trigger comparing those
 * keys against the literal `'AiRunStatusId'` answered no to
 * `AiRun.update({ ai_run_status_id: 2 }, { where: { id }, fields: ['ai_run_status_id'],
 * validate: false })`, and a canceled run reached running with the whole apparatus below unentered.
 * `fields` is what keeps such a key in `options.fields`, and `validate: false` is what keeps it in
 * the values at all — with validation on, the build drops it and the update degrades to nothing.
 * Every written key is therefore put to `rawAttributes`, which knows an attribute by its own name
 * and by its `field`, and what is compared is the attribute the key resolves to.
 *
 * **And a key that resolves to no attribute is refused outright, before the status is asked
 * about.** Such a key is the hazard one column wide, seen whole: whatever it spells reaches the
 * statement unexamined, so a guard that let it past would be guarding the names it knows against
 * a caller free to use any other. What it costs is a caller writing a column name for a field that
 * is not the status — refused now where Sequelize would have quietly dropped it, or passed it to
 * the database to reject. That is the safe side to be wrong on, and the refusal names the way out.
 *
 * **A bulk update that writes the status is refused unless its `where` is one this model can
 * prove, and reading the caller's condition object is not how it is proved.** What the rule
 * forbids is a run moving **out of** a terminal status, so an update whose condition cannot match
 * a settled row cannot break it, whatever status it writes. Twice now a guard has tried to answer
 * that by reading the object the caller handed over, and twice the object and the statement turned
 * out to say different things. A key found inside it is not the proof: Sequelize compiles a
 * column's condition as a unit, and `{ [Op.notIn]: [3, 4, 5], [Op.and]: [{ [Op.gte]: 1 }] }`
 * compiles to `` (`ai_run_status_id` >= 1) `` alone, in either key order. The object's own shape
 * is not the proof either: the same `Op.and` carried on a **prototype** answers no own symbol to a
 * reader counting them and is still compiled into the statement, and a canceled run was walked
 * back to running under exactly that shape.
 *
 * **So the condition is compiled, and what is compared is the text the query generator emits.**
 * This model builds the one condition it can vouch for — the run addressed by its id, every
 * terminal status stated as one the matched row must not carry — compiles it through the same
 * query generator the statement will be compiled by, and accepts a `where` only when that `where`
 * compiles to the same text, character for character. A status id that merely looks right does not
 * survive the comparison, because the text being matched is not a pattern but a rendering this
 * model produced out of `AiRunTerminalStatusInspector`'s own ids: `'3'` renders quoted, an
 * exclusion on another column renders that column's name, and a subset, a superset or another
 * order renders another list. Which statuses are terminal is read from that inspector — the same
 * answer `AiRunStatusRecorder` builds its `where` out of, so the proof and the thing being proved
 * can never come to disagree about what a terminal status is.
 *
 * **And the condition that was proved is the condition the statement is made under.** A caller's
 * object is read twice — once by this hook, once when the query is generated — so something that
 * answers differently the second time would be proved on one condition and run on another: a
 * getter, or a `Proxy` whose `ownKeys` trap counts its calls. `options.where` is therefore
 * replaced by the condition this model built and compiled, which Sequelize reads after the hook
 * and generates the statement from (`sequelize/lib/model.js`, `update()`). It is a substitution
 * and not a narrowing, and the comparison above is what makes it one: an accepted `where` compiled
 * to exactly this condition, so there is nothing in it left to drop. For the only caller in this
 * application — `AiRunStatusRecorder#buildUnsettledAiRunCondition()` — nothing changes but the
 * identity of the object, which is how that write goes through this hook rather than around it
 * with `hooks: false`.
 *
 * **What is refused is wider than what is unsafe, deliberately.** A `where` that excludes the same
 * statuses in another order, or one that carries a further condition of its own, or one that
 * addresses runs by anything but a single id, is refused although it would have been safe. Sorting
 * the safe renderings from the unsafe ones would put this model back in the business of predicting
 * a query compiler, which is the business both earlier guards failed at; refusing a safe condition
 * costs a caller a refusal naming the class to go through, and accepting an unsafe one costs a
 * settled run.
 *
 * **What neither hook closes.** `.upsert()` reaches `beforeUpsert` / `afterUpsert` and no per-row
 * hook, with no `individualHooks` option to turn into one; `.bulkCreate()` with `updateOnDuplicate`
 * is the same write spelled differently. `Model.update({ hooks: false })` and
 * `instance.save({ hooks: false })` switch the guard off by asking. `queryInterface` and raw SQL
 * reach no model hook at all, which is what the seeders depend on. `.destroy()` removes the run
 * rather than moving it, so it is not this rule's to refuse.
 *
 * Two more, and both were got wrong the first time this list was written.
 *
 * **`.increment()` and `.decrement()` do move a status**, and the earlier claim that no status is
 * reached by arithmetic was simply false — `run.increment('AiRunStatusId', { by: 1 })` emits
 * `SET ai_run_status_id = ai_run_status_id + 1` and walked a run from succeeded to failed under a
 * re-audit's probe. They reach their own hooks and neither of ours.
 *
 * **A fabricated instance passes the row-reading guard**, because `beforeUpdate` judges against
 * `entity.previous()` and an instance built by hand supplies that itself:
 * `AiRun.build({ id, AiRunStatusId: 1 }, { isNewRecord: false })`, then a save, moved a settled run.
 *
 * Nothing in this application takes any of those paths against `ai_runs` today, and each is a
 * deliberate act by a caller rather than something reached by accident.
 *
 * **A third was added by the round that found the column-name write, and it is the one the list
 * had no entry for: `beforeUpdate` cannot see a status written under the field name.** Under
 * `Model.update({ …, individualHooks: true })` Sequelize copies the caller's values into each
 * instance's `dataValues` wholesale, so the instance handed to `beforeUpdate` carried
 * `AiRunStatusId: 5` and `ai_run_status_id: 2` at once — the guard compared the attribute against
 * its own unchanged previous value, found no move, and let a statement past that moved one. That
 * path is closed here and not there: `beforeBulkUpdate` runs before the `individualHooks` branch
 * is reached, so a bulk update naming the status under either name is now refused before any
 * instance is built, and one naming an attribute this model does not declare is refused earlier
 * still. **`beforeUpdate` itself is no stricter than it was**, and the reason it needs to be no
 * stricter is that nothing but that bulk path puts a field-named key in front of it: an instance
 * reached through `instance.set()` drops a key `rawAttributes` does not carry, and
 * `instance.update({ ai_run_status_id: 2 })` was accepted and wrote nothing at all. Both were run
 * against the real table. What would re-open it is a bulk write reaching `beforeUpdate` without
 * passing `beforeBulkUpdate`, which today means `hooks: false` — already the first entry above.
 *
 * **Read the list as the paths known to go around the hook, and not as a bound on what can move a
 * settled run.** It has been wrong twice. Once by claiming no status is reached by arithmetic,
 * which `increment` disproved. Once by omission that no list of this kind could have covered: the
 * `Op.notIn` a sibling operator hides, above, moved a settled run without going around the hook at
 * all — it went through it, carrying something the hook read as a proof. What has established the
 * list both times is a probe run against the real table, and not a reading of this file.
 *
 * **What the bulk guard itself does not see, stated rather than claimed closed.** It compares a
 * rendering and then writes under its own object, and neither of those makes it a bound on what
 * can move a settled run. It reads `options.where` at the position Sequelize 6.37.8 reads it back
 * from, so a release that took the `where` somewhere else before generating the statement would
 * un-pin the substitution silently — what then still holds is the weaker sentence, that the
 * caller's `where` compiled to this model's condition at the instant the hook asked. A `where`
 * this generator cannot compile is refused rather than read, so a release that renames
 * `getWhereConditions()` turns every transition write in this service into that refusal — loudly,
 * and in the first test that runs. And nothing here reads which run the id names: an update
 * addressing an unsettled run it had no business addressing is accepted, because the rule this
 * guard carries is about the status a run leaves and not about who may write it.
 *
 * **What it asks of a key is what `rawAttributes` answers**, so the two names a column is known by
 * are the two this model declares it under, and a third that Sequelize might one day resolve
 * without declaring would be refused rather than read — again the safe side. It reads
 * `options.attributes` at the position Sequelize 6.37.8 leaves the caller's values in, and that
 * position, like the one `options.where` is read back at, is a release's to move.
 *
 * @class AiRun
 * @extends {BaseAppRenchanModel}
 */
export default class AiRun extends BaseAppRenchanModel {
  /**
   * Define model attributes
   *
   * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
   * @returns {object} Model attributes
   */
  static createAttributes (DataTypes) {
    const factory = ModelAttributeFactory.create(DataTypes)

    return {
      ...factory.ID_BIGINT,

      // ForeignKey must start with upper case.
      ApiClientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // ForeignKey must start with upper case.
      AiRunStatusId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      runKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      requestKey: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      requestBodyHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      externalRef: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      subjectLabel: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      correlationId: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      callbackUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      requestBody: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      resultBody: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      failureReasonCode: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      failureParameters: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      engineLabel: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
      },
      startedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      finishedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      cancelRequestedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      canceledAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
      contentPurgedAt: {
        type: DataTypes.DATE(3),
        allowNull: true,
      },
    }
  }

  /**
   * Define model options
   *
   * @param {import('sequelize').Sequelize} sequelizeClient - Sequelize instance
   * @returns {object} Model options
   */
  static createOptions (sequelizeClient) {
    return {
      ...super.createOptions(sequelizeClient),
    }
  }

  /**
   * Define model associations
   */
  static associate () {
    super.associate?.()

    this.belongsTo(this._.ApiClient)
    this.belongsTo(this._.AiRunCategory)
    this.belongsTo(this._.AiRunStatus)

    this.hasMany(this._.AiRunStep)
    this.hasMany(this._.AiRunFieldOutcome)
    this.hasMany(this._.AiRunMedia)
    this.hasMany(this._.AiModelCall)
    this.hasMany(this._.AiRunCallbackDelivery)
  }

  /**
   * Define model scopes
   *
   * @param {import('sequelize').Op} Op - Sequelize operators
   */
  static defineScopes (Op) {
    super.defineScopes?.(Op)

    // noop
  }

  /**
   * Define subqueries
   */
  static defineSubqueries () {
    super.defineSubqueries?.()

    // noop
  }

  /**
   * Setup model hooks
   */
  static setupHooks () {
    super.setupHooks?.()

    this.beforeUpdate(entity => {
      if (
        !this.leavesTerminalAiRunStatus({
          entity,
        })
      ) {
        return
      }

      throw new Error(`${REFUSED_SETTLED_TRANSITION_MESSAGE}: AiRunId ${entity.id}, AiRunStatusId ${entity.previous(AI_RUN_STATUS_ATTRIBUTE_NAME)} to ${entity.AiRunStatusId}`)
    })

    this.beforeBulkUpdate(options => {
      if (
        this.writesUnrecognizedFieldInBulk({
          options,
        })
      ) {
        throw new Error(REFUSED_UNKNOWN_BULK_FIELD_MESSAGE)
      }

      if (
        !this.writesAiRunStatusInBulk({
          options,
        })
      ) {
        return
      }

      const provenAiRunCondition = this.buildProvenUnsettledAiRunCondition({
        where: options.where,
      })

      if (provenAiRunCondition === null) {
        throw new Error(REFUSED_BULK_STATUS_UPDATE_MESSAGE)
      }

      /*
       * `beforeBulkUpdate` has no return channel. Sequelize reads `options.where` back after
       * the hook and builds the statement from it, so assigning here is the only way this
       * model's own condition — rather than the caller's object — is what the UPDATE runs
       * under. Without it the guarantee drops to the weaker sentence: the caller's `where`
       * compiled to this condition at the instant the hook asked, which a `where` answering
       * differently on a second read would satisfy while running something else.
       *
       * What permits the assignment is `eslint.config.js`, which relaxes `no-param-reassign`'s
       * `props` for this file and nothing else — narrower than the inline disable that stood here,
       * which needed `eslint-comments/no-use` turned off for the whole file to be written at all.
       */
      options.where = provenAiRunCondition
    })
  }

  /**
   * get: the query operators a `where` states its conditions with.
   *
   * Reached through a getter rather than referred to inside the method that reads a `where`, so
   * that the one place this model touches Sequelize's own vocabulary is named, and a test can
   * stand something else in its place without reaching into the module registry.
   *
   * @returns {typeof Op} Operators.
   */
  static get sequelizeOperators () {
    return Op
  }

  /**
   * Check whether an update moves a run out of a status it never leaves.
   *
   * The comparison is against the row's own previous value rather than against the values the
   * caller passed, so a write that names no status — the content purge, an engine label — reads as
   * unchanged and passes. Only a status that differs from a terminal one is a move out of it.
   *
   * @param {{
   *   entity: *
   * }} params - Parameters.
   * @returns {boolean} Whether the run is leaving a terminal status.
   */
  static leavesTerminalAiRunStatus ({
    entity,
  }) {
    const previousAiRunStatusId = entity.previous(AI_RUN_STATUS_ATTRIBUTE_NAME)

    if (entity.AiRunStatusId === previousAiRunStatusId) {
      return false
    }

    const aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector()

    return aiRunTerminalStatusInspector.isTerminalAiRunStatus({
      aiRunStatusId: previousAiRunStatusId,
    })
  }

  /**
   * Create the inspector answering whether a status is one a run never leaves.
   *
   * @returns {AiRunTerminalStatusInspector} Inspector.
   */
  static createAiRunTerminalStatusInspector () {
    return AiRunTerminalStatusInspector.create()
  }

  /**
   * Check whether a bulk update writes a key this model declares no attribute for.
   *
   * The question asked before the status is asked about, because a key this model cannot place is
   * one no guard reading this model's attributes can judge: `Utils.mapValueFieldNames()` passes it
   * into the `SET` clause exactly as the caller wrote it. What follows from true is the refusal,
   * and it is raised for a key naming any column, not only the status.
   *
   * @param {{
   *   options: *
   * }} params - Parameters.
   * @returns {boolean} Whether a written key names no attribute of this model.
   */
  static writesUnrecognizedFieldInBulk ({
    options,
  }) {
    const writtenFieldNames = this.extractWrittenFieldNames({
      options,
    })

    return writtenFieldNames
      .some(fieldName =>
        this.extractAiRunAttributeName({
          fieldName,
        }) === null
      )
  }

  /**
   * Check whether a bulk update names the run status among the values it writes.
   *
   * `beforeBulkUpdate` is handed the options rather than a row, and `options.attributes` holds the
   * values the caller passed, keyed by whatever text the caller wrote — Sequelize 6.37.8 maps
   * attribute names to column names after this hook, not before it. So each key is put to
   * `rawAttributes` and what is compared is the attribute it names: `AiRunStatusId` and
   * `ai_run_status_id` are one column under two names, and a guard that knew only the first let a
   * caller spelling the second walk a canceled run back to running. An update naming no status is
   * not this rule's to refuse — it moves no status, so whatever its `where` says about statuses is
   * beside the point — and this is the question that lets such a write past before any condition
   * is read.
   *
   * @param {{
   *   options: *
   * }} params - Parameters.
   * @returns {boolean} Whether the run status is among the values being written.
   */
  static writesAiRunStatusInBulk ({
    options,
  }) {
    const writtenFieldNames = this.extractWrittenFieldNames({
      options,
    })

    return writtenFieldNames
      .some(fieldName =>
        this.extractAiRunAttributeName({
          fieldName,
        }) === AI_RUN_STATUS_ATTRIBUTE_NAME
      )
  }

  /**
   * Extract the keys a bulk update states its values under.
   *
   * Options carrying no values at all answer none, which is a call that writes nothing rather than
   * a call this model has anything to say about.
   *
   * **A key carried on the values' prototype is an own key by the time this is asked**, so
   * `Object.keys` is enough here — and that was established by a probe against the real table
   * rather than assumed. `Model.update()` rebuilds the values through lodash's `omitBy` before
   * running this hook, and lodash walks the prototype chain into a new plain object, so
   * `Object.create({ ai_run_status_id: 2 })` arrives with that key its own and is refused. The
   * prototype channel is worth naming because it is where an earlier guard in this feature failed:
   * `AiRunStatusRecorder`'s allow-list was read with `Object.keys` while Sequelize's own setter
   * walked the chain, and the two ends disagreed about what a field is. Here they agree only
   * because something else flattened them first, which is a fact about lodash and Sequelize and
   * not about this method.
   *
   * @param {{
   *   options: *
   * }} params - Parameters.
   * @returns {Array<string>} The keys, as the caller wrote them.
   */
  static extractWrittenFieldNames ({
    options,
  }) {
    return Object.keys(options.attributes ?? {})
  }

  /**
   * Extract the attribute a written key names, out of the two names a column is known by.
   *
   * An attribute's own name answers itself; the `field` this model maps it to answers the
   * attribute that maps to it. Anything else answers null, which the caller above turns into a
   * refusal. The own-key test is what keeps `'constructor'` and `'toString'` from resolving
   * through `Object.prototype` to something that is no attribute of this table.
   *
   * @param {{
   *   fieldName: string
   * }} params - Parameters.
   * @returns {string | null} The attribute name, or null when the key names no attribute.
   */
  static extractAiRunAttributeName ({
    fieldName,
  }) {
    const attributeHash = this.rawAttributes

    if (Object.hasOwn(attributeHash, fieldName)) {
      return fieldName
    }

    const matchedAttributeEntry = Object.entries(attributeHash)
      .find(([, attribute]) => attribute.field === fieldName)
      ?? null

    if (matchedAttributeEntry === null) {
      return null
    }

    const [attributeName] = matchedAttributeEntry

    return attributeName
  }

  /**
   * Build the condition a bulk status write may be made under, out of the one a caller stated.
   *
   * The answer is this model's own condition object — never the caller's — or null when the
   * caller's states something else. What is compared is not the two objects but the two predicates
   * the query generator makes of them, because the predicate is what the condition amounts to in
   * the statement, and the object is what has twice been read to say something the predicate did
   * not.
   *
   * Comparing a whole rendering, rather than looking for this model's exclusion inside the
   * caller's, is what keeps a value from spelling the exclusion out: a string carrying the words
   * `NOT IN (3, 4, 5)` renders inside quotes and as a condition on the column that held it, so a
   * `where` carrying one renders as something this model never wrote.
   *
   * @param {{
   *   where: *
   * }} params - Parameters.
   * @returns {Record<string, *> | null} The condition to write under, or null when the caller
   * stated one this model cannot prove.
   */
  static buildProvenUnsettledAiRunCondition ({
    where,
  }) {
    const aiRunId = this.extractAiRunId({
      where,
    })

    if (aiRunId === null) {
      return null
    }

    const unsettledAiRunCondition = this.buildUnsettledAiRunCondition({
      aiRunId,
    })

    const provenWherePredicate = this.generateEmittedWherePredicate({
      where: unsettledAiRunCondition,
    })

    if (provenWherePredicate === null) {
      return null
    }

    const statedWherePredicate = this.generateEmittedWherePredicate({
      where,
    })

    if (statedWherePredicate !== provenWherePredicate) {
      return null
    }

    return unsettledAiRunCondition
  }

  /**
   * Extract the run a condition addresses, when it addresses one by its id.
   *
   * The value is read once and answered, so that the condition compared below and the condition
   * written under are built out of the same read — a `where` whose `id` answers differently the
   * second time renders differently and is refused by the comparison rather than accepted by it.
   *
   * What the id is held to is `AiRunKeyInspector`, the same question `AiRunStatusRecorder` holds
   * its own `aiRunId` to before it builds the condition this one is compared against. A value that
   * is no key — a `Sequelize.literal`, an object, a negative number — answers null, and what
   * follows from null is the refusal.
   *
   * @param {{
   *   where: *
   * }} params - Parameters.
   * @returns {*} The id, or null when the condition addresses no single run by one.
   */
  static extractAiRunId ({
    where,
  }) {
    const aiRunId = where?.id
      ?? null

    if (aiRunId === null) {
      return null
    }

    const aiRunKeyInspector = this.createAiRunKeyInspector()

    if (
      !aiRunKeyInspector.isRecordableKey({
        key: aiRunId,
      })
    ) {
      return null
    }

    return aiRunId
  }

  /**
   * Create the inspector answering whether a value is a key of this feature.
   *
   * @returns {AiRunKeyInspector} Inspector.
   */
  static createAiRunKeyInspector () {
    return AiRunKeyInspector.create()
  }

  /**
   * Build the one condition this model can prove matches no run that has settled.
   *
   * The run is addressed by its id, and every terminal status is stated as one the matched row
   * must not carry. Which statuses those are is read from `AiRunTerminalStatusInspector`, which is
   * also where `AiRunStatusRecorder` reads them — written here as literals, this condition and the
   * recorder's would agree right up until a sixth status was added to one of them, and the write
   * the recorder makes would start being refused.
   *
   * @param {{
   *   aiRunId: *
   * }} params - Parameters.
   * @returns {Record<string, *>} The condition.
   */
  static buildUnsettledAiRunCondition ({
    aiRunId,
  }) {
    const aiRunTerminalStatusInspector = this.createAiRunTerminalStatusInspector()

    return {
      id: aiRunId,
      [AI_RUN_STATUS_ATTRIBUTE_NAME]: {
        [this.sequelizeOperators.notIn]: aiRunTerminalStatusInspector.terminalAiRunStatusIds,
      },
    }
  }

  /**
   * Generate the predicate Sequelize's own query generator makes of a condition.
   *
   * The generator is the model's own — the one that compiles the statement — so what a condition
   * amounts to here is what it amounts to there, rather than what a reader of the object would
   * make of it. The one difference is spelling and not meaning: an attribute is still named as the
   * model names it, because `Model.update()` maps attribute names to column names after this hook
   * has run, on whatever `where` the options carry by then. Both conditions are rendered by this
   * one call, so a difference between the two renderings is a difference in what will be asked.
   *
   * **A condition it cannot compile answers null rather than throwing, and the failure is not
   * logged.** Null is refused by the caller above, which is the safe side of the question to be
   * wrong on; and the exception's message is built out of the `where`, which is a caller's text
   * and is the one thing this feature keeps out of a log. What reports the event is the refusal
   * the caller raises, which names this model and the class to go through instead.
   *
   * @param {{
   *   where: *
   * }} params - Parameters.
   * @returns {string | null} The emitted predicate, or null when the condition cannot be compiled.
   */
  static generateEmittedWherePredicate ({
    where,
  }) {
    try {
      return this.queryGenerator.getWhereConditions(where, this.tableName, this)
    } catch {
      return null
    }
  }
}
