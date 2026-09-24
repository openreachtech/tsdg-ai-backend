import {
  BackupMixinModel,
  ModelAttributeFactory,
} from '@openreachtech/renchan-sequelize'

import BaseAppRenchanModel from '../baseModel/BaseAppRenchanModel.js'

const REFUSED_UPDATE_MESSAGE = 'AiAgentDefaultInstruction.update() is refused. Load the rows and save() each one.'

const REFUSED_BULK_CREATE_MESSAGE_HEAD = 'AiAgentDefaultInstruction.bulkCreate() refuses the option: '

const REFUSED_BULK_CREATE_OPTION_NAMES = [
  'updateOnDuplicate',
  'ignoreDuplicates',
  'include',
]

/**
 * AiAgentDefaultInstruction model
 *
 * The agent's own instruction, held as a row so that rewording it is a database write rather than
 * a deployment.
 *
 * The backup mixin appends the values of every save to `AiAgentDefaultInstructionBk`, so the live
 * row holds the current text while the sink holds every text there has ever been, current one
 * included. `savedAt` is what tells those generations apart, and a model call records it as the
 * version of the prompt it sent.
 *
 * `savedAt` is stamped by `setupHooks()` on every save and is not the writer's to supply: a value
 * the caller sets is overwritten, so no wording can be filed under a generation that already holds
 * different text. `.bulkCreate()` is overridden to force `individualHooks` on, so it is stamped and
 * appended exactly as `.save()` is. `.update()` is refused outright, because no flag makes it
 * honor this contract — the method's own docblock says why.
 *
 * Four ways of writing this table reach neither the stamp nor the sink. `queryInterface` and raw
 * SQL reach no model hook at all, and the seeders depend on that — they insert their own sink row
 * beside the live one. `save({ hooks: false })` is the same thing spelled differently. `.upsert()`
 * reaches no per-row hook either: Sequelize gives it `beforeUpsert` / `afterUpsert` only, and no
 * `individualHooks` option to turn into one, so it cannot be closed the way `.bulkCreate()` was;
 * nothing in this application upserts these rows. `.increment()` / `.decrement()` likewise bypass
 * both, and are listed only for completeness — this table holds no field worth incrementing.
 *
 * One more gap is the mixin's, not this class's: the sink append runs in `afterSave`, outside any
 * transaction a bare `.save()` opened, so a sink write that fails leaves the live row already
 * committed. See Q54.
 *
 * @class AiAgentDefaultInstruction
 * @extends {BaseAppRenchanModel}
 */
export default class AiAgentDefaultInstruction extends BaseAppRenchanModel {
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
      AiAgentId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
      },
      instruction: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      savedAt: {
        type: DataTypes.DATE(3),
        allowNull: false,
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

    this.belongsTo(this._.AiAgent)
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

    /*
     * The generation marker is the server's to assign, and never the writer's.
     *
     * A model call records this instant as the version of the prompt it sent, and resolves that
     * record back to one row of the write-once sink. A writer free to choose the instant could hand
     * a new wording the one an older generation already carries, and every call recorded under it
     * would then resolve to text that was never sent. Stamping it here puts the value out of the
     * writer's reach on every path that reaches a model hook, after whatever the caller set and
     * before the row and the sink row the backup mixin appends are written.
     *
     * The stamp is derived from the row rather than from the clock alone. Two wordings saved inside
     * one millisecond would otherwise carry one instant, and the marker would stop telling those
     * generations apart; a clock that went backwards would file a new wording under an instant an
     * older one already holds. Reading the row's own previous marker covers both, and covers a
     * second process that loaded the row after the first committed — which a process-local counter
     * would not.
     *
     * What it does not cover: two writers that loaded the same row and save within one millisecond,
     * `queryInterface` and raw SQL, `save({ hooks: false })`, and a transaction that spans the live
     * write and the sink append. The class comment names the ones that matter.
     */
    this.beforeSave(entity => {
      const previousSavedAt = new Date(entity.previous('savedAt') ?? 0)
      const currentAt = new Date()

      const savedAt = currentAt > previousSavedAt
        ? currentAt
        : new Date(previousSavedAt.getTime() + 1)

      entity.set('savedAt', savedAt)
    })
  }

  /**
   * Refuse a static update.
   *
   * `Model.update()` cannot leave the trail this class promises, and which way it fails is decided
   * by the data rather than by the call. Sequelize runs the per-row hooks for every matched row and
   * then compares the changed-value sets: identical sets are written as one statement whose field
   * list is union'd with the keys the hooks set, so `savedAt` is written; differing sets are written
   * row by row with `hooks: false`, where that union never happens and the stamp is left out of the
   * statement (`sequelize/lib/model.js`, `update()` and `save()`).
   *
   * The `afterUpdate` hooks run on both branches, so the sink is appended on both. On the second
   * that leaves a sink row carrying a marker the live row never received, while the live row keeps
   * an older one — and that older marker then resolves, through `PromptVersionGenerator`, to a
   * wording the agent has already stopped sending. A call recorded under it would name text that
   * was never sent, which is the one failure this table exists to prevent.
   *
   * Forcing `individualHooks` does not close it, because both branches live inside that flag. So
   * the method is refused rather than half-honored: load the rows and `save()` each one, which is
   * the path the stamp and the sink are guaranteed on.
   *
   * @override
   * @throws {Error} Always
   */
  static async update () {
    throw new Error(REFUSED_UPDATE_MESSAGE)
  }

  /**
   * Create rows in bulk, with the per-row hooks forced on.
   *
   * Without `individualHooks`, `bulkCreate` writes the rows through `beforeBulkCreate` alone and
   * reaches neither the stamp nor the sink. Forcing it from the model rather than asking every call
   * site to pass it is what makes it unbypassable.
   *
   * Three of Sequelize's own options stop working under that flag, so they are refused by name
   * instead of failing somewhere deeper: `updateOnDuplicate` raises a `TypeError`, because the
   * flag's branch never computes the `upsertKeys` the insert path then reads; `ignoreDuplicates` is
   * deleted by that branch and quietly does nothing; and `include` is skipped, because the
   * `BelongsTo` pre-creation sits in the branch the flag does not take (`sequelize/lib/model.js`,
   * `bulkCreate()`). The first is loud, the other two are silent, and silence is what this class is
   * built against.
   *
   * @override
   * @param {Array<object>} records - Records to create
   * @param {object} [options] - Create options
   * @returns {Promise<*>} Created entities
   * @throws {Error} When an option the forced flag breaks is passed
   */
  static async bulkCreate (
    records,
    options = {}
  ) {
    const refusedOptionName = this.extractRefusedBulkCreateOptionName({
      options,
    })

    if (refusedOptionName) {
      throw new Error(`${REFUSED_BULK_CREATE_MESSAGE_HEAD}${refusedOptionName}`)
    }

    return super.bulkCreate(
      records,
      {
        ...options,
        individualHooks: true,
      }
    )
  }

  /**
   * Extract the name of the first refused bulk-create option the caller passed.
   *
   * @param {{
   *   options: object
   * }} params
   * @returns {string | null} The option name, or null when none was passed
   */
  static extractRefusedBulkCreateOptionName ({
    options,
  }) {
    return REFUSED_BULK_CREATE_OPTION_NAMES
      .find(it => it in options)
      ?? null
  }

  /**
   * get: Mixin models to apply
   *
   * @returns {Array<Function>} Mixin models
   */
  static get Mixins () {
    return [
      BackupMixinModel,
    ]
  }

  /**
   * get: Backup model for BackupMixinModel
   *
   * @returns {typeof import('./AiAgentDefaultInstructionBk.js').default} Backup model declaration
   */
  static get BackupModel () {
    return this._.AiAgentDefaultInstructionBk
  }
}
