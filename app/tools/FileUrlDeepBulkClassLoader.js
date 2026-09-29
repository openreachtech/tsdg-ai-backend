import url from 'node:url'

import {
  DeepBulkClassLoader,
} from '@openreachtech/renchan'

/*
 * What an entry already converted looks like. The walk this class overrides recurses through
 * `this`, so an entry reaching the conversion may already have been through it — the scheme is what
 * tells the two apart.
 */
const FILE_URL_SCHEME = 'file://'

/**
 * A deep bulk class loader handing back file names a real ESM loader will accept.
 *
 * **What it works around.** `DeepBulkClassLoader#loadFileNames()` builds its entries with
 * `path.join()`, so on Windows they are drive-lettered filesystem paths — `D:\...`. Its
 * `#loadClasses()` then does `await import(it)` on each. Node's ESM loader refuses a bare absolute
 * path there and answers `ERR_UNSUPPORTED_ESM_URL_SCHEME`, naming the drive letter as an unsupported
 * protocol, so a plain `node` process discovers no class at all. An ESM dynamic import wants a
 * `file://` URL, which is what this override hands back.
 *
 * **Why nothing caught it.** Under jest, babel rewrites `import()` into a `require()` interop that
 * takes a Windows path without complaint, so the suite stays green over a boot that does not work.
 * The tests here therefore assert the shape of what `#loadFileNames()` returns, not that an import
 * succeeds — the assertion jest is able to make honestly.
 *
 * **Why the conversion is idempotent.** The base walk recurses as `this.loadFileNames({ poolPath })`
 * for a subdirectory, which reaches this override. So what `super.loadFileNames()` hands back is a
 * mixture: entries directly in the pool are raw paths, entries from a subdirectory have already been
 * converted. Converting the lot unconditionally would run `pathToFileURL()` twice over every nested
 * entry and produce a URL with the project root glued in front of it. Skipping an entry that already
 * carries the scheme is what keeps one conversion per entry at any depth.
 *
 * Ordering needs no care of its own: the base filters entries against `/\.[cm]?js$/u`, and a file
 * URL ending in `.js` satisfies it exactly as the path did.
 */
export default class FileUrlDeepBulkClassLoader extends DeepBulkClassLoader {
  /**
   * get: node url module — a seam so tests can substitute it.
   *
   * @returns {typeof url} The url module.
   */
  static get url () {
    return url
  }

  /**
   * get: own constructor, so a subclass's overrides are the ones that answer.
   *
   * @returns {typeof FileUrlDeepBulkClassLoader} The class.
   */
  get Ctor () {
    return /** @type {typeof FileUrlDeepBulkClassLoader} */ (this.constructor)
  }

  /**
   * Load the names of the files a pool directory holds, as file URLs.
   *
   * @override
   * @param {{
   *   poolPath?: string
   * }} [params] - Parameters.
   * @returns {Array<string>} File URLs, one per file found under the pool directory.
   * @public
   */
  loadFileNames ({
    poolPath = this.poolPath,
  } = {}) {
    const fileNames = super.loadFileNames({
      poolPath,
    })

    return fileNames.map(it =>
      this.generateFileUrl({
        fileName: it,
      })
    )
  }

  /**
   * Generate the file URL of one entry the walk found.
   *
   * Answers an entry that already carries the scheme as it stands, so that an entry reached through
   * the base's recursion is converted once and not twice.
   *
   * @param {{
   *   fileName: string
   * }} params - Parameters.
   * @returns {string} The entry as a file URL.
   */
  generateFileUrl ({
    fileName,
  }) {
    if (
      this.isFileUrl({
        fileName,
      })
    ) {
      return fileName
    }

    return this.Ctor.url.pathToFileURL(fileName)
      .href
  }

  /**
   * Check whether an entry the walk found is already a file URL.
   *
   * @param {{
   *   fileName: string
   * }} params - Parameters.
   * @returns {boolean} True when the entry already carries the file URL scheme.
   */
  isFileUrl ({
    fileName,
  }) {
    return fileName.startsWith(FILE_URL_SCHEME)
  }
}
