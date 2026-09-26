import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import AiRunKeyInspector from '../aiRun/AiRunKeyInspector.js'

/*
 * The name of the directory one run's fetched files live in, and the prefix its files are named
 * with.
 *
 * Both are built out of ids this service minted. Nothing a caller wrote is ever a path segment -
 * see the class comment on why `media_key` is not usable as a file name.
 */
const WORKSPACE_DIRECTORY_PREFIX = 'ai-run-media-'
const MEDIUM_FILE_PREFIX = 'medium-'

const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a run that is not an id'
const UNREADABLE_AI_RUN_MEDIA_ID_MESSAGE = 'refused a medium that is not an id'

/**
 * Holds the temporary copies of one run's fetched files, and removes them when the run ends.
 *
 * **No fetched file is kept in long-term storage, and this class is where that is true.** Section
 * 18 says so twice - the table holds no file bytes, and the temporary copy lives on the worker's
 * disk for the length of the run - so the bytes go to a directory under the operating system's own
 * temporary directory, never into a column, never under the repository, and never anywhere a
 * retention sweep would have to be taught about. The sixth acceptance criterion is a property of
 * where the file is put, and the fifth is `#removeWorkspace()` being called when the run ends.
 *
 * **One directory per run, removed whole.** Removing the directory rather than the files inside it
 * is what makes the fifth criterion hold for a run that failed halfway: a run that fetched four of
 * its twelve files leaves four files nobody enumerated, and a caller that had to name each one in
 * order to delete it would need a record of what it had managed to fetch. `#removeWorkspace()`
 * needs no such record, and a run whose directory was never created removes nothing without
 * complaining.
 *
 * **Nothing the caller wrote becomes a path.** A file is named for the `ai_run_media` row it
 * belongs to, and `media_key` - the caller's own id for the file, which this service echoes back
 * and never interprets - is not a path segment here or anywhere. A key of `../../etc/passwd` is a
 * perfectly legal key under the contract, and a file name built out of one would write outside the
 * directory this class promises to remove. Both ids are put through `AiRunKeyInspector` before they
 * reach a path, so a segment is always digits.
 *
 * **The removal is not a `catch`-and-carry-on.** `rm` is asked with `force`, so a directory that is
 * not there is not a failure; what remains a failure is a directory that is there and could not be
 * removed, and that is raised rather than swallowed, because it is a fetched file still sitting on
 * a disk after the run that fetched it ended.
 *
 * **What stays open, stated rather than claimed closed.** The workspace lives for as long as the
 * process lets it: a worker killed between the fetch and the removal leaves the directory behind,
 * and nothing here sweeps one left by a process that is gone. The operating system's own temporary
 * directory is the mitigation rather than a plan - it is the one place a machine is expected to
 * clear - and a deployment that keeps its worker's temporary directory across reboots has a file
 * outliving its run with nothing in this service to say so.
 */
export default class AiRunMediaWorkspace {
  /**
   * Constructor.
   *
   * @param {AiRunMediaWorkspaceParams} params - Parameters.
   */
  constructor ({
    aiRunId,
    workspaceRootPath,
    aiRunKeyInspector,
  }) {
    this.aiRunId = aiRunId
    this.workspaceRootPath = workspaceRootPath
    this.aiRunKeyInspector = aiRunKeyInspector
  }

  /**
   * Factory method.
   *
   * @template {X extends typeof AiRunMediaWorkspace ? X : never} T, X
   * @param {AiRunMediaWorkspaceFactoryParams} params - Parameters for the factory method.
   * @returns {InstanceType<T>} Instance of this class.
   * @this {T}
   * @public
   */
  static create ({
    aiRunId,
    workspaceRootPath = this.buildWorkspaceRootPath(),
    aiRunKeyInspector = this.createAiRunKeyInspector(),
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        aiRunId,
        workspaceRootPath,
        aiRunKeyInspector,
      })
    )
  }

  /**
   * get: the file system, as promises.
   *
   * @returns {typeof fsPromises} The module.
   */
  static get fsPromises () {
    return fsPromises
  }

  /**
   * get: the operating system module, which answers where temporary files belong.
   *
   * @returns {typeof os} The module.
   */
  static get operatingSystem () {
    return os
  }

  /**
   * get: the path module.
   *
   * @returns {typeof path} The module.
   */
  static get nodePath () {
    return path
  }

  /**
   * Build the directory every run's workspace is made under.
   *
   * @returns {string} The path of the machine's own temporary directory.
   */
  static buildWorkspaceRootPath () {
    return this.operatingSystem.tmpdir()
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
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof AiRunMediaWorkspace} The class.
   */
  get Ctor () {
    return /** @type {typeof AiRunMediaWorkspace} */ (this.constructor)
  }

  /**
   * Create the directory this run's fetched files live in.
   *
   * @returns {Promise<string>} The path of the directory.
   * @throws {Error} When the run is not an id.
   * @public
   */
  async createWorkspace () {
    const workspacePath = this.buildWorkspacePath()

    await this.Ctor.fsPromises.mkdir(workspacePath, {
      recursive: true,
    })

    return workspacePath
  }

  /**
   * Build the path of the directory this run's fetched files live in.
   *
   * @returns {string} The path of the directory.
   * @throws {Error} When the run is not an id.
   * @public
   */
  buildWorkspacePath () {
    const comparableAiRunId = this.aiRunKeyInspector.generateComparableKey({
      key: this.aiRunId,
    })

    if (comparableAiRunId === null) {
      throw new Error(`${this.Ctor.name}#buildWorkspacePath() ${UNREADABLE_AI_RUN_ID_MESSAGE}`)
    }

    const directoryName = `${WORKSPACE_DIRECTORY_PREFIX}${comparableAiRunId}`

    return this.Ctor.nodePath.join(this.workspaceRootPath, directoryName)
  }

  /**
   * Write the temporary copy of one fetched file.
   *
   * @param {{
   *   aiRunMediaId: *
   *   bytes: Buffer
   * }} params - Parameters.
   * @returns {Promise<string>} The path the copy was written to.
   * @throws {Error} When the run or the medium is not an id.
   * @public
   */
  async writeMediumFile ({
    aiRunMediaId,
    bytes,
  }) {
    const mediumFilePath = this.buildMediumFilePath({
      aiRunMediaId,
    })

    await this.createWorkspace()

    await this.Ctor.fsPromises.writeFile(mediumFilePath, bytes)

    return mediumFilePath
  }

  /**
   * Build the path the temporary copy of one file is written to.
   *
   * The segment is the medium's own id and never its media key, so that a key the caller chose can
   * never reach outside the directory this class removes.
   *
   * @param {{
   *   aiRunMediaId: *
   * }} params - Parameters.
   * @returns {string} The path of the file.
   * @throws {Error} When the run or the medium is not an id.
   * @public
   */
  buildMediumFilePath ({
    aiRunMediaId,
  }) {
    const comparableAiRunMediaId = this.aiRunKeyInspector.generateComparableKey({
      key: aiRunMediaId,
    })

    if (comparableAiRunMediaId === null) {
      throw new Error(`${this.Ctor.name}#buildMediumFilePath() ${UNREADABLE_AI_RUN_MEDIA_ID_MESSAGE}`)
    }

    const workspacePath = this.buildWorkspacePath()

    const fileName = `${MEDIUM_FILE_PREFIX}${comparableAiRunMediaId}`

    return this.Ctor.nodePath.join(workspacePath, fileName)
  }

  /**
   * Remove every temporary copy this run fetched, and the directory holding them.
   *
   * Called when the run ends, however it ended - the fifth acceptance criterion asks for the
   * deletion and not for the run having succeeded.
   *
   * @returns {Promise<string>} The path that was removed.
   * @throws {Error} When the run is not an id, or when the directory could not be removed.
   * @public
   */
  async removeWorkspace () {
    const workspacePath = this.buildWorkspacePath()

    await this.Ctor.fsPromises.rm(workspacePath, {
      recursive: true,
      force: true,
    })

    return workspacePath
  }
}

/**
 * @typedef {{
 *   aiRunId: number | string
 *   workspaceRootPath: string
 *   aiRunKeyInspector: AiRunKeyInspector
 * }} AiRunMediaWorkspaceParams
 */

/**
 * @typedef {{
 *   aiRunId: number | string
 *   workspaceRootPath?: string
 *   aiRunKeyInspector?: AiRunKeyInspector
 * }} AiRunMediaWorkspaceFactoryParams
 */
