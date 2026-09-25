/*
 * The range `datetime(3)` itself can hold, which is what bounds an instant rather than any taste of
 * ours. A time outside it is not a time this trace could have been written at.
 */
const EARLIEST_RECORDABLE_INSTANT = new Date('1000-01-01T00:00:00.000Z')
const LATEST_RECORDABLE_INSTANT = new Date('9999-12-31T23:59:59.999Z')

/**
 * Answers whether a value is an instant this service may record.
 *
 * **Why the question is a class of its own.** Every table of the decision trace carries instants —
 * a step's `started_at` and `finished_at`, a field outcome's `settled_at`, a run's `started_at`,
 * `finished_at` and `canceled_at` — and each of the three recorders that write them declared
 * `Date` in its signature while asking nothing of what arrived. The question is one question with
 * one answer, asked by whatever is about to write, so it is answered in one place rather than three
 * times over. Keeping it apart from the write also makes it answerable without a database: it takes
 * a value and returns a boolean.
 *
 * **What this exists to refuse is not `null`.** A missing instant was already refused, loudly, by
 * the evidence rule that reads these same fields. What reached the column instead was a value that
 * is present and is not a time: Sequelize coerces whatever it is handed into `datetime(3)`, so a
 * string, a plain object or a boolean all settle as the literal text `Invalid date`. That is worse
 * than the null it replaced in the one way that matters — a sweep for `finished_at IS NULL` finds
 * nothing, no parser resolves it, and on a run that has reached a terminal status nothing may ever
 * write over it. The row is wrong for the two years it is kept, and reads as filled in.
 *
 * **A `Date` is required, never a value one could be made from.** Coercion is how this happened,
 * so the three signatures that say `Date` are held to it: a string that happens to parse is a
 * caller not honoring what it was asked for, and accepting it would leave the same door ajar for
 * the next string that does not parse.
 *
 * **A value sitting on `Date.prototype` with no time of its own is refused too.** `instanceof` asks
 * only about the prototype chain, so `Object.create(Date.prototype)` and a genuine `Date` behind a
 * proxy both pass it and then throw on `getTime()`. They are refused rather than allowed to fault,
 * because a method that answers a boolean has to answer one.
 *
 * **An out-of-range instant is refused beside an unparseable one**, because the harm is the same.
 * `new Date(8.64e15)` is a valid `Date` naming a year the column cannot store, so a guard that
 * asked only `is this a Date` would pass it to be truncated or rejected by the driver, differently
 * on SQLite and MariaDB.
 */
export default class AiRunInstantInspector {
  /**
   * Constructor.
   *
   * @param {AiRunInstantInspectorParams} params - Parameters.
   */
  constructor ({
    earliestRecordableInstant,
    latestRecordableInstant,
  }) {
    this.earliestRecordableInstant = earliestRecordableInstant
    this.latestRecordableInstant = latestRecordableInstant
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunInstantInspector ? X : never} T, X
   * @param {AiRunInstantInspectorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    earliestRecordableInstant = EARLIEST_RECORDABLE_INSTANT,
    latestRecordableInstant = LATEST_RECORDABLE_INSTANT,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        earliestRecordableInstant,
        latestRecordableInstant,
      })
    )
  }

  /**
   * Check whether a value is an instant this service may record.
   *
   * @param {{
   *   instant: *
   * }} params - Parameters.
   * @returns {boolean} Whether it is a recordable instant.
   * @public
   */
  isRecordableInstant ({
    instant,
  }) {
    if (!(instant instanceof Date)) {
      return false
    }

    if (
      !this.carriesReadableTime({
        instant,
      })
    ) {
      return false
    }

    return this.fallsWithinRecordableRange({
      instant,
    })
  }

  /**
   * Check whether a real time can be read off a value that says it is a `Date`.
   *
   * `instanceof` asks about the prototype chain, and a value can sit on `Date.prototype` while
   * carrying no time at all — `Object.create(Date.prototype)`, or a genuine `Date` behind a proxy,
   * which has no internal slot of its own. Both answer true to `instanceof` and then throw on
   * `getTime()`, including through `Date.prototype.getTime.call()`, so there is no way to ask
   * except by asking.
   *
   * **Nothing is logged here, and that is deliberate rather than an omission.** The failure is not
   * swallowed: the caller refuses the write and names the field it refused, which is strictly more
   * than a log line from inside a predicate would say. What this method must not do is what it did
   * for one commit — fault out of a method whose stated contract is that it answers a boolean, so
   * that the recorder above it reported neither the refusal nor the run.
   *
   * @param {{
   *   instant: Date
   * }} params - Parameters.
   * @returns {boolean} Whether a real time can be read.
   * @public
   */
  carriesReadableTime ({
    instant,
  }) {
    try {
      return !Number.isNaN(instant.getTime())
    } catch (error) {
      return false
    }
  }

  /**
   * Check whether an instant falls within the range the column can hold.
   *
   * @param {{
   *   instant: Date
   * }} params - Parameters.
   * @returns {boolean} Whether it falls within the range.
   */
  fallsWithinRecordableRange ({
    instant,
  }) {
    if (instant.getTime() < this.earliestRecordableInstant.getTime()) {
      return false
    }

    return instant.getTime() <= this.latestRecordableInstant.getTime()
  }
}

/**
 * @typedef {{
 *   earliestRecordableInstant: Date
 *   latestRecordableInstant: Date
 * }} AiRunInstantInspectorParams
 */

/**
 * @typedef {Partial<AiRunInstantInspectorParams>} AiRunInstantInspectorFactoryParams
 */
