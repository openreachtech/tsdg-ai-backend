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

/*
 * The permissions the workspace directory and each file in it are created under: the owner alone,
 * and nobody else at all.
 *
 * The temporary directory of a machine is shared ground. Every local account can read it, and the
 * files in it are a caller's photographs - personal data under the non-functional section - so a
 * file created under the process's umask, which is commonly `644`, is one every account on that
 * host can read for the length of the run. These two numbers are what the file system is asked
 * for; what it does with them is the platform's, and the class comment says where that stops.
 */
const WORKSPACE_DIRECTORY_MODE = 0o700
const MEDIUM_FILE_MODE = 0o600

/*
 * The permission bits belonging to anybody but the owner.
 *
 * An existing directory is measured against this rather than against `0o700` exactly, because a
 * directory this process created and then had its mode tightened further is still its own.
 */
const PERMISSIONS_BEYOND_OWNER = 0o077

/*
 * What the file system answers with when a path is already taken.
 *
 * `mkdir` is asked without `recursive`, so a path already taken is answered with this code rather
 * than with success: it is the one answer that says "somebody got here first", and that has to be
 * examined rather than adopted.
 */
const EXISTING_PATH_ERROR_CODE = 'EEXIST'

const UNREADABLE_AI_RUN_ID_MESSAGE = 'refused a run that is not an id'
const UNREADABLE_AI_RUN_MEDIA_ID_MESSAGE = 'refused a medium that is not an id'
const FOREIGN_WORKSPACE_MESSAGE = 'refused a workspace path this process does not own'

/**
 * Holds the temporary copies of one run's fetched files, and removes them when the run ends.
 *
 * **No fetched file is kept in long-term storage, and this class is where that is true.** Section
 * 18 says so twice - the table holds no file bytes, and the temporary copy lives on the worker's
 * disk for the length of the run - so the bytes go to a directory under the operating system's own
 * temporary directory, never into a column, never under the repository, and never anywhere a
 * retention sweep would have to be taught about. The sixth acceptance criterion is a property of
 * where the file is put, and the fifth is `#removeWorkspace()` being called when the run ends.
 * Both of those are properties of the directory the bytes went into, which is why the paragraph
 * below is part of the same promise rather than a hardening note beside it.
 *
 * **The path is predictable, so the directory is claimed rather than assumed.** It has to be
 * predictable: `#removeWorkspace()` is called from a `finally` holding nothing but the run's id,
 * and a random suffix would have to be remembered somewhere that survives a process restart, which
 * is nowhere. What follows from that is that any local account on the worker host can work out the
 * next directory names and create them first. So the directory is created with `mkdir` **without**
 * `recursive` - which answers `EEXIST` for a path already taken rather than adopting it - and a
 * path that was already there is then examined: it must be a directory in its own right, which is
 * what refuses a symbolic link or a junction pointing somewhere else, and where the platform names
 * a user it must be this process's own with no permission granted beyond the owner. A path that
 * fails that is refused by exception, and the run fails, rather than the run writing a caller's
 * photograph into a directory somebody else chose and `#removeWorkspace()` unlinking the link
 * while the bytes stay on disk.
 *
 * **Each file is created for the owner alone, and never over a file already there.** `0o600` is
 * asked for rather than left to the process's umask, and the write is made with `wx`, which fails
 * on an existing path. The second half is the other end of the same hole: a file pre-created at a
 * predictable path would otherwise be truncated and rewritten with the caller's bytes, whatever it
 * was and whoever owned it. The cost is that one medium is written once per run - a second write
 * of the same medium is refused rather than replacing the first - and no caller in this version
 * writes one twice.
 *
 * **The root is trusted and not created.** `os.tmpdir()` is the machine's own answer to where
 * temporary files go, and nothing here builds a path to it: `mkdir` is asked for one directory,
 * so a root that is not there is an error and not a tree this class creates. A deployment that
 * points the root somewhere else has made that path part of the promise above.
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
 * **What stays open, stated rather than claimed closed.** Four things.
 *
 * The claim check and the write are two steps, and between them is a window.
 * `#confirmOwnWorkspaceDirectory()` answers for the path as `lstat` found it; the `writeFile` that
 * follows resolves the path again. Somebody able to remove the directory in between can leave a
 * symbolic link to a directory of their own in its place, and `wx` guards the final component
 * only - so the file is created, under `0o600`, inside the directory they chose, and
 * `#removeWorkspace()` then unlinks their link and leaves the bytes. That is the scenario the
 * paragraph above says the check prevents, and the check on its own does not prevent it. What does
 * is that the removal the attack has to open with cannot be made: `os.tmpdir()` answers a
 * sticky-bit directory on POSIX - `/tmp`, mode `1777` - where only an entry's own owner may unlink
 * it. So "the root is trusted" above is resting on that bit, said here rather than assumed, and a
 * deployment pointing the root at a world-writable directory without it has taken the window back.
 *
 * The workspace lives for as long as the process lets it: a worker killed between the fetch and
 * the removal leaves the directory behind, and nothing here sweeps one left by a process that is
 * gone. The operating system's own temporary directory is the mitigation rather than a plan - it
 * is the one place a machine is expected to clear - and a deployment that keeps its worker's
 * temporary directory across reboots has a file outliving its run with nothing in this service to
 * say so.
 *
 * The ownership half of the claim check is only as good as the platform's answer. `process.getuid`
 * exists on POSIX and not on Windows, and where it is absent an existing *directory* is accepted
 * on the strength of its being a directory alone - so on such a platform a plain directory
 * pre-created by another local account is still adopted. The link case is refused everywhere,
 * because that one is answered by `lstat` rather than by a user id. A worker running where the
 * platform names no user therefore has the weaker of the two checks, and this says which one it
 * has lost rather than leaving a reader to assume both are kept.
 *
 * The mode numbers are requests, and a platform answers them or it does not. Where user ids exist
 * the mode is both asked for and read back, so a directory granting anything beyond its owner is
 * refused; where they do not, the platform reports the same bits whatever was asked for and
 * neither the request nor a check of it would mean anything, so neither is made. What is
 * load-bearing on every platform is the pair of refusals - an existing path that is not a
 * directory, and an existing file - rather than the bits.
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
   * get: the running process, which answers the user this worker runs as.
   *
   * @returns {typeof process} The process.
   */
  static get nodeProcess () {
    return process
  }

  /**
   * Extract the user id this process runs as, where the platform names one.
   *
   * `process.getuid` is POSIX's and is absent on Windows, so the absence is answered as null rather
   * than as a user id nobody has - which is what lets the caller say plainly which half of the
   * claim check a platform without user ids is left with.
   *
   * @returns {number | null} The user id, or null where the platform names none.
   */
  static extractOwnUserId () {
    return this.nodeProcess.getuid?.()
      ?? null
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
   * Create the directory this run's fetched files live in, and claim it.
   *
   * The two steps are one promise and are written as two methods because they answer two
   * questions: the first makes the directory where there is none, and the second says whether what
   * is at the path is this process's own directory - which is the question a predictable path
   * makes worth asking, and which `mkdir` with `recursive` answered by never raising it.
   *
   * It is asked again on every write rather than once per run, because this class holds no memory
   * of having run it and a second instance of it for the same run holds none either. That is what
   * makes an existing path something to examine rather than something to refuse.
   *
   * @returns {Promise<string>} The path of the directory.
   * @throws {Error} When the run is not an id, when the path is taken by something this process
   * does not own, or when the directory could not be created.
   * @public
   */
  async createWorkspace () {
    const workspacePath = this.buildWorkspacePath()

    await this.createWorkspaceDirectory({
      workspacePath,
    })

    await this.confirmOwnWorkspaceDirectory({
      workspacePath,
    })

    return workspacePath
  }

  /**
   * Create the directory, and let one that is already there stand for the check that follows.
   *
   * `recursive` is deliberately not asked for. It would build every missing parent, and - the part
   * that matters here - it answers success for a path that already exists, whatever is at it and
   * whoever made it. Without it an existing path is `EEXIST`, which is a fact the caller can act
   * on. Every other failure is raised as it arrived.
   *
   * @param {{
   *   workspacePath: string
   * }} params - Parameters.
   * @returns {Promise<string>} The path of the directory.
   * @throws {Error} When the directory could not be created for any reason but an existing path.
   * @public
   */
  async createWorkspaceDirectory ({
    workspacePath,
  }) {
    try {
      await this.Ctor.fsPromises.mkdir(workspacePath, {
        mode: WORKSPACE_DIRECTORY_MODE,
      })

      return workspacePath
    } catch (error) {
      if (error?.code !== EXISTING_PATH_ERROR_CODE) {
        throw error
      }

      return workspacePath
    }
  }

  /**
   * Confirm what is at the path is this process's own directory, and refuse what is not.
   *
   * @param {{
   *   workspacePath: string
   * }} params - Parameters.
   * @returns {Promise<string>} The path of the directory.
   * @throws {Error} When the path is taken by something this process does not own.
   * @public
   */
  async confirmOwnWorkspaceDirectory ({
    workspacePath,
  }) {
    const workspaceStatus = await this.Ctor.fsPromises.lstat(workspacePath)

    if (
      !this.isOwnPrivateDirectory({
        workspaceStatus,
      })
    ) {
      throw new Error(`${this.Ctor.name}#confirmOwnWorkspaceDirectory() ${FOREIGN_WORKSPACE_MESSAGE}`)
    }

    return workspacePath
  }

  /**
   * Check whether an entry is a directory this process alone can reach.
   *
   * The status is `lstat`'s and never `stat`'s, which is the whole of the first test: `stat`
   * follows a symbolic link and would answer for the directory at the far end of one, so a link
   * planted at this path would be called a directory and the bytes would be written wherever it
   * pointed. `lstat` answers for the link itself, and a link is not a directory.
   *
   * @param {{
   *   workspaceStatus: import('node:fs').Stats
   * }} params - Parameters.
   * @returns {boolean} Whether it is this process's own private directory.
   * @public
   */
  isOwnPrivateDirectory ({
    workspaceStatus,
  }) {
    if (!workspaceStatus.isDirectory()) {
      return false
    }

    const ownUserId = this.Ctor.extractOwnUserId()

    if (ownUserId === null) {
      return true
    }

    if (workspaceStatus.uid !== ownUserId) {
      return false
    }

    return (workspaceStatus.mode & PERMISSIONS_BEYOND_OWNER) === 0
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
   * **`wx` and `0o600` are the file's half of what the directory above promises.** `wx` creates
   * the file or fails; it never opens one that is already there, so a file somebody pre-created at
   * this predictable path is refused rather than truncated and filled with a caller's photograph.
   * `0o600` asks for the owner alone rather than leaving the mode to the process's umask, which on
   * a common server grants every local account a read of it for the length of the run.
   *
   * @param {{
   *   aiRunMediaId: *
   *   bytes: Buffer
   * }} params - Parameters.
   * @returns {Promise<string>} The path the copy was written to.
   * @throws {Error} When the run or the medium is not an id, when the workspace is not this
   * process's own, or when a file is already at the path.
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

    await this.Ctor.fsPromises.writeFile(mediumFilePath, bytes, {
      mode: MEDIUM_FILE_MODE,
      flag: 'wx',
    })

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
