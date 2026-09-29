import crypto from 'node:crypto'

const DEFAULT_RUN_KEY_BYTE_SIZE = 32

/**
 * Mints the opaque key a caller holds for a run, stored in `ai_runs.run_key`.
 *
 * **Why `crypto.randomBytes(32)`.** The run key is the whole of what a caller presents to read or
 * to cancel its run, so a key anyone can guess is a key to somebody else's run. `randomBytes` is a
 * cryptographic generator: its output is not a deterministic sequence, so holding any number of
 * keys narrows down none of the ones minted next. Thirty-two bytes rendered as sixty-four lower
 * case hex characters, which the unique index on `ai_runs.run_key` stores as it arrives.
 *
 * **Why not a UUID, and why no random-text package.** A version-4 UUID carries 122 random bits
 * against these 256, and spends characters on a layout that means nothing to a caller here. A
 * package would add a dependency to do what one call into the crypto module already does. This
 * repository has already reviewed `randomBytes(32).toString('hex')` for session tokens; reusing it
 * leaves one answer to "how is an unguessable value minted here" rather than two that drift apart.
 */
export default class RunKeyGenerator {
  /**
   * Constructor.
   *
   * @param {RunKeyGeneratorParams} params - Parameters.
   */
  constructor ({
    runKeyByteSize,
  }) {
    this.runKeyByteSize = runKeyByteSize
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof RunKeyGenerator ? X : never} T, X
   * @param {RunKeyGeneratorFactoryParams} [params] - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    runKeyByteSize = DEFAULT_RUN_KEY_BYTE_SIZE,
  } = {}) {
    return /** @type {InstanceType<T>} */ (
      new this({
        runKeyByteSize,
      })
    )
  }

  /**
   * get: crypto module — a seam so tests can substitute it.
   *
   * @returns {typeof crypto} The crypto module.
   */
  static get crypto () {
    return crypto
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof RunKeyGenerator} The class.
   */
  get Ctor () {
    return /** @type {typeof RunKeyGenerator} */ (this.constructor)
  }

  /**
   * Generate the key a caller holds for a run.
   *
   * @returns {string} Run key, as lower case hex.
   * @public
   */
  generateRunKey () {
    return this.Ctor.crypto.randomBytes(this.runKeyByteSize)
      .toString('hex')
  }
}

/**
 * @typedef {{
 *   runKeyByteSize: number
 * }} RunKeyGeneratorParams
 */

/**
 * @typedef {Partial<RunKeyGeneratorParams>} RunKeyGeneratorFactoryParams
 */
