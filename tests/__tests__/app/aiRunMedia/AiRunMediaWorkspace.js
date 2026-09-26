import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import AiRunMediaWorkspace from '../../../../app/aiRunMedia/AiRunMediaWorkspace.js'

import AiRunKeyInspector from '../../../../app/aiRun/AiRunKeyInspector.js'

/*
 * The fifth and sixth acceptance criteria of section 18: the temporary copy of a fetched file is
 * deleted when the run ends, and no fetched file is kept in long-term storage.
 *
 * The file system is not mocked here. It is the thing under test - a spy saying `rm` was called
 * would pass against an implementation that removed the wrong directory - so the cases write real
 * bytes under the machine's own temporary directory and then read the disk to see that they are
 * gone. Reading the disk in the assertion is deliberate and is the only way the deletion is
 * observable; it is the external effect the criterion is about, not a re-query of what the method
 * already returned. The planted directories and links two of the describes below stand a run's
 * workspace path up against are real too, and so is the file mode one of them reads back.
 *
 * Two describes are the exception and say so where they sit: `#isOwnPrivateDirectory()` and
 * `.extractOwnUserId()` reason about a status owned by another account and about a platform that
 * names no account at all, neither of which a test may create on the machine it is running on.
 * Those two state the rule; every other describe in this file observes it.
 *
 * The run ids are this feature's own (`10440001` upward), so a directory this file creates belongs
 * to this file and to nothing else.
 *
 * **What this file leaves on the disk, and why it is left.** A run of it leaves three directories
 * and one file under the machine's own temporary directory, and nothing here removes them on the
 * way out. That is a decision rather than an oversight.
 *
 * Repeat-safety does not depend on it: every describe that would trip over a leftover clears its
 * own path in the arrange phase, which is what `wx` obliges - a write that never truncates fails
 * on a file a previous run left, so starting from nothing is the arrange's job and is done there.
 *
 * What a removal after the assertions would add is a removal that does not run. A failing
 * assertion ends the test body where it stands, so the only run whose leavings would survive is
 * the run that failed - and that is the one run whose leavings are worth reading, because the
 * directory and its mode are the evidence of what went wrong. The machine's temporary directory is
 * the one place a host is expected to clear.
 *
 * **What "nothing here can collide" is true of, stated narrowly.** The run ids are this feature's
 * own, so nothing this file writes lands on another feature's path. That much was once written as
 * though it settled the question, and it does not settle it: a POSIX `os.tmpdir()` is shared by
 * every account on the host, and a directory created under it carries the process umask rather
 * than a mode of its own. So on a shared build host the second account to run this file meets its
 * predecessor's leavings rather than its own - `EACCES` from a `mkdir` inside a root somebody
 * else owns, or this class's own refusal of a workspace owned by another account, which is the
 * class working correctly and failing the run anyway. The root below is therefore namespaced by
 * the uid, which is the key both of those turn on.
 *
 * What that still does not cover is one account running this file twice at once: each describe's
 * arrange clears its own path, so two such runs race, and nothing here makes that safe.
 */

/*
 * The account the root is namespaced to, because the directory above it is not namespaced at all.
 *
 * A POSIX `os.tmpdir()` is one directory for the whole host; Windows already gives each account
 * its own and has no uid to name, so there the key is the platform's name and carries nothing.
 */
const TEST_WORKSPACE_OWNER_KEY = process.getuid?.()
  ?? 'windows'

const TEST_WORKSPACE_ROOT_PATH = path.join(
  os.tmpdir(),
  `tsdg-ai-media-workspace-test-${TEST_WORKSPACE_OWNER_KEY}`
)

/*
 * The root is created by each case that needs one, rather than by the class under test.
 *
 * `#createWorkspace()` asks `mkdir` for one directory and not for a tree, so the directory the
 * workspace sits in has to be there already - which in a deployment is the machine's own temporary
 * directory and here is the directory above. That is the point of it: a `mkdir` building every
 * missing parent also answers success for a path that already exists, whoever made it.
 */

/*
 * The permission bits, and what the file system answers when the mode this class asks for is read
 * back off a file it created.
 *
 * Where a platform has owner-group-other permissions the answer is the 0o600 that was asked for.
 * Windows expresses a read-only bit and nothing else: measured on this platform, a file created
 * asking 0o600 reads back 0o666, and one asking 0o400 reads back 0o444 - so what survives the
 * round trip is the owner-write bit alone, and the two other triads are invented from it. The
 * figure asserted there is therefore the platform's own and says nothing about this service. It is
 * 0o666 because this class asks for a mode that carries owner-write; it is not, as an earlier
 * round of this comment had it, what Windows answers whatever was asked. The describe
 * that fails without the fix on every platform is `'should refuse a file already at the path'`,
 * which sits above the mode describe rather than below it - an existing file refused rather than
 * truncated and rewritten.
 */
const PERMISSION_BITS = 0o777
const EXPECTED_MEDIUM_FILE_MODE = process.platform === 'win32'
  ? 0o666
  : 0o600

describe('AiRunMediaWorkspace', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#aiRunId', () => {
        const cases = [
          {
            params: {
              aiRunId: 10440001,
              workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: 10440001,
          },
          {
            params: {
              aiRunId: 10440002,
              workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: 10440002,
          },
        ]

        test.each(cases)('aiRunId: $params.aiRunId', ({
          params,
          expected,
        }) => {
          const workspace = new AiRunMediaWorkspace(params)

          expect(workspace)
            .toHaveProperty('aiRunId', expected)
        })
      })

      describe('#workspaceRootPath', () => {
        const cases = [
          {
            params: {
              aiRunId: 10440003,
              workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: TEST_WORKSPACE_ROOT_PATH,
          },
          {
            params: {
              aiRunId: 10440004,
              workspaceRootPath: os.tmpdir(),
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            expected: os.tmpdir(),
          },
        ]

        test.each(cases)('aiRunId: $params.aiRunId', ({
          params,
          expected,
        }) => {
          const workspace = new AiRunMediaWorkspace(params)

          expect(workspace)
            .toHaveProperty('workspaceRootPath', expected)
        })
      })

      describe('#aiRunKeyInspector', () => {
        const cases = [
          {
            params: {
              aiRunId: 10440005,
              workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
              aiRunKeyInspector: AiRunKeyInspector.create(),
            },
            label: 'the inspector of this feature',
          },
        ]

        test.each(cases)('label: $label', ({
          params,
        }) => {
          const workspace = new AiRunMediaWorkspace(params)

          expect(workspace)
            .toHaveProperty('aiRunKeyInspector', params.aiRunKeyInspector)
        })
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          params: {
            aiRunId: 10440006,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
        },
        {
          params: {
            aiRunId: 10440007,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
      }) => {
        const actual = AiRunMediaWorkspace.create(params)

        expect(actual)
          .toBeInstanceOf(AiRunMediaWorkspace)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          params: {
            aiRunId: 10440008,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
        },
        {
          params: {
            aiRunId: 10440009,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
            aiRunKeyInspector: AiRunKeyInspector.create(),
          },
        },
      ]

      test.each(cases)('aiRunId: $params.aiRunId', ({
        params,
      }) => {
        const SpyClass = constructorSpy.spyOn(AiRunMediaWorkspace)

        SpyClass.create(params)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(params)
      })
    })

    describe('should use the machine temporary directory by default', () => {
      test('with the run stated alone', () => {
        const buildWorkspaceRootPathSpy = jest.spyOn(AiRunMediaWorkspace, 'buildWorkspaceRootPath')
          .mockReturnValue(TEST_WORKSPACE_ROOT_PATH)

        const workspace = AiRunMediaWorkspace.create({
          aiRunId: 10440010,
        })

        expect(workspace)
          .toHaveProperty('workspaceRootPath', TEST_WORKSPACE_ROOT_PATH)
        expect(buildWorkspaceRootPathSpy)
          .toHaveBeenCalledWith()
      })
    })

    describe('should use default aiRunKeyInspector value', () => {
      test('with the run stated alone', () => {
        const createAiRunKeyInspectorSpy = jest.spyOn(AiRunMediaWorkspace, 'createAiRunKeyInspector')

        const workspace = AiRunMediaWorkspace.create({
          aiRunId: 10440011,
        })

        expect(workspace.aiRunKeyInspector)
          .toBeInstanceOf(AiRunKeyInspector)
        expect(createAiRunKeyInspectorSpy)
          .toHaveBeenCalledWith()
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('.buildWorkspaceRootPath()', () => {
    test('should build the directory temporary files belong under', () => {
      const expected = os.tmpdir()

      const actual = AiRunMediaWorkspace.buildWorkspaceRootPath()

      expect(actual)
        .toBe(expected)
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#buildWorkspacePath()', () => {
    describe('should build a directory belonging to the run alone', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440012,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440012'),
        },
        {
          factoryParams: {
            aiRunId: '10440013',
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440013'),
        },
      ]

      test.each(cases)('aiRunId: $factoryParams.aiRunId', ({
        factoryParams,
        expected,
      }) => {
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = workspace.buildWorkspacePath()

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * A run id that is not an id never becomes a path segment. The last two cases are the reason
     * the guard is here rather than trusted to the caller: both are values that would walk out of
     * the directory this class promises to remove.
     */
    describe('should refuse a run that is not an id', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: null,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          label: 'no run at all',
        },
        {
          factoryParams: {
            aiRunId: '../../etc',
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          label: 'a path walking out of the root',
        },
        {
          factoryParams: {
            aiRunId: 'ai-run-media-10440012',
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          label: 'the name of another run directory',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
      }) => {
        const expected = 'refused a run that is not an id'

        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.buildWorkspacePath()

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#buildMediumFilePath()', () => {
    describe('should name a file for the medium it belongs to', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440014,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440101,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440014', 'medium-10440101'),
        },
        {
          factoryParams: {
            aiRunId: 10440015,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: '10440102',
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440015', 'medium-10440102'),
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', ({
        factoryParams,
        params,
        expected,
      }) => {
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = workspace.buildMediumFilePath(params)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * The media key the caller chose is never a file name, and this is what stands in the way. Both
     * values below are legal media keys under the contract - it is echoed back and never
     * interpreted - and both would write outside the run's own directory.
     */
    describe('should refuse a medium that is not an id', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440016,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: '../../../etc/passwd',
          },
          label: 'a media key walking out of the directory',
        },
        {
          factoryParams: {
            aiRunId: 10440017,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 'media-key-front-elevation',
          },
          label: 'the caller media key where the row id belongs',
        },
        {
          factoryParams: {
            aiRunId: 10440018,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: null,
          },
          label: 'no medium at all',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
      }) => {
        const expected = 'refused a medium that is not an id'

        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.buildMediumFilePath(params)

        expect(actual)
          .toThrow(expected)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#writeMediumFile()', () => {
    describe('should write the temporary copy of a fetched file', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440019,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440103,
            bytes: Buffer.from('front-elevation-bytes'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440019', 'medium-10440103'),
        },
        {
          factoryParams: {
            aiRunId: 10440020,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440104,
            bytes: Buffer.from('kitchen-counter-bytes'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440020', 'medium-10440104'),
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })

        /*
         * A previous run of this suite left its copy here, and `writeMediumFile()` now opens with
         * `wx` -- it creates or fails, never truncates. So the arrange phase has to start from
         * nothing, or the second run of the suite fails where the first passed. The refusal itself
         * is the subject of its own describe below; a leftover is pollution, not a case.
         */
        await fsPromises.rm(expected, {
          force: true,
        })
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = await workspace.writeMediumFile(params)

        expect(actual)
          .toBe(expected)
        await expect(fsPromises.readFile(actual))
          .resolves
          .toEqual(params.bytes)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#removeWorkspace()', () => {
    /*
     * The fifth criterion itself. The copy is written in the arrange phase because the deletion is
     * what is under test, and the assertion reads the disk because "the file is gone" is not
     * observable any other way.
     */
    describe('should delete every temporary copy the run fetched', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440021,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440105,
            bytes: Buffer.from('balcony-view-bytes'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440021'),
        },
        {
          factoryParams: {
            aiRunId: 10440022,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440106,
            bytes: Buffer.from('parking-space-bytes'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440022'),
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const workspace = AiRunMediaWorkspace.create(factoryParams)
        const mediumFilePath = await workspace.writeMediumFile(params)

        const actual = await workspace.removeWorkspace()

        expect(actual)
          .toBe(expected)
        await expect(fsPromises.readFile(mediumFilePath))
          .rejects
          .toThrow('ENOENT') // the file is gone, not merely unreadable
      })
    })

    /*
     * A run that failed before it fetched anything still ends, and the removal still runs. A
     * directory that was never created is not a failure.
     */
    describe('should remove nothing without complaining', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440023,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440023'),
        },
        {
          factoryParams: {
            aiRunId: 10440024,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440024'),
        },
      ]

      test.each(cases)('aiRunId: $factoryParams.aiRunId', async ({
        factoryParams,
        expected,
      }) => {
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = await workspace.removeWorkspace()

        expect(actual)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#createWorkspace()', () => {
    describe('should create the directory the run files live in', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440025,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440025'),
        },
        {
          factoryParams: {
            aiRunId: 10440026,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440026'),
        },
      ]

      test.each(cases)('aiRunId: $factoryParams.aiRunId', async ({
        factoryParams,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = await workspace.createWorkspace()

        expect(actual)
          .toBe(expected)
        await expect(fsPromises.readdir(actual))
          .resolves
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#createWorkspace()', () => {
    /*
     * The workspace path is derived from a sequential run id, so it is predictable, and it has to
     * be - the removal is called from a `finally` holding nothing but that id. What follows is that
     * any local account can create the next few directory names first.
     *
     * A link is the case that costs the most: `mkdir` asked with `recursive` answers success for a
     * path already taken, whatever is at it, so the run wrote its files through the link into a
     * directory somebody else chose, and `rm` - which `lstat`s - then unlinked the link and left
     * the bytes where they were. Both acceptance criteria were void with no error raised.
     *
     * The link here is made with the junction type so that the case runs on every platform; the
     * target is read back afterwards to show that nothing was written through it.
     */
    describe('should refuse a path already taken by a link to somewhere else', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440030,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: 'refused a workspace path this process does not own',
        },
        {
          factoryParams: {
            aiRunId: 10440031,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          expected: 'refused a workspace path this process does not own',
        },
      ]

      test.each(cases)('aiRunId: $factoryParams.aiRunId', async ({
        factoryParams,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const plantedTargetPath = path.join(TEST_WORKSPACE_ROOT_PATH, `planted-target-${factoryParams.aiRunId}`)
        await fsPromises.rm(plantedTargetPath, {
          recursive: true,
          force: true,
        })
        await fsPromises.mkdir(plantedTargetPath)
        const plantedLinkPath = path.join(TEST_WORKSPACE_ROOT_PATH, `ai-run-media-${factoryParams.aiRunId}`)
        await fsPromises.rm(plantedLinkPath, {
          recursive: true,
          force: true,
        })
        await fsPromises.symlink(plantedTargetPath, plantedLinkPath, 'junction')
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.createWorkspace()

        await expect(actual)
          .rejects
          .toThrow(expected)
        await expect(fsPromises.readdir(plantedTargetPath))
          .resolves
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#writeMediumFile()', () => {
    /*
     * The same planted link, taken all the way through to the bytes: the fetched file must not
     * land in the directory the link points at. The target is read back because that is the only
     * place the failure would show - an exception alone would not say where the bytes went.
     */
    describe('should write no bytes through a path taken by a link', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440032,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440110,
            bytes: Buffer.from('front-elevation-bytes'),
          },
        },
        {
          factoryParams: {
            aiRunId: 10440033,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440111,
            bytes: Buffer.from('kitchen-counter-bytes'),
          },
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        factoryParams,
        params,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const plantedTargetPath = path.join(TEST_WORKSPACE_ROOT_PATH, `planted-target-${factoryParams.aiRunId}`)
        await fsPromises.rm(plantedTargetPath, {
          recursive: true,
          force: true,
        })
        await fsPromises.mkdir(plantedTargetPath)
        const plantedLinkPath = path.join(TEST_WORKSPACE_ROOT_PATH, `ai-run-media-${factoryParams.aiRunId}`)
        await fsPromises.rm(plantedLinkPath, {
          recursive: true,
          force: true,
        })
        await fsPromises.symlink(plantedTargetPath, plantedLinkPath, 'junction')
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.writeMediumFile(params)

        await expect(actual)
          .rejects
          .toThrow('refused a workspace path this process does not own')
        await expect(fsPromises.readdir(plantedTargetPath))
          .resolves
          .toHaveLength(0)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#writeMediumFile()', () => {
    /*
     * The file's half of the same hole. Without `wx` the write opens whatever is at the path and
     * truncates it, so a file pre-created at a predictable name is replaced by a caller's
     * photograph. The pre-existing bytes are read back to show the file was left alone rather than
     * merely that the call failed.
     */
    /*
     * **The planted directory is created `0o700` on purpose, and the case does not work without
     * it.** `#confirmOwnWorkspaceDirectory()` refuses a workspace granting any permission beyond
     * its owner, so a directory left at the umask default — `0o755` on a typical Linux — is
     * refused before `writeMediumFile()` ever reaches the file, and this case would assert the
     * wrong refusal. Planting it the way the class itself creates one is what leaves `EEXIST` as
     * the only thing left to refuse.
     *
     * **It is written down because one platform cannot see it.** Where `process.getuid` does not
     * exist, `#isOwnPrivateDirectory()` answers true before it reads the mode at all, so this
     * case passes on Windows whatever the planted directory's permissions are. It was CI on Linux
     * that found it.
     */
    describe('should refuse a file already at the path', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440034,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440112,
            bytes: Buffer.from('front-elevation-bytes'),
          },
          expected: Buffer.from('bytes-planted-before-the-run'),
        },
        {
          factoryParams: {
            aiRunId: 10440035,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440113,
            bytes: Buffer.from('kitchen-counter-bytes'),
          },
          expected: Buffer.from('bytes-of-a-file-somebody-else-made'),
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const plantedWorkspacePath = path.join(TEST_WORKSPACE_ROOT_PATH, `ai-run-media-${factoryParams.aiRunId}`)
        await fsPromises.rm(plantedWorkspacePath, {
          recursive: true,
          force: true,
        })
        await fsPromises.mkdir(plantedWorkspacePath, {
          mode: 0o700,
        })
        const plantedFilePath = path.join(plantedWorkspacePath, `medium-${params.aiRunMediaId}`)
        await fsPromises.writeFile(plantedFilePath, expected)
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.writeMediumFile(params)

        await expect(actual)
          .rejects
          .toThrow('EEXIST')
        await expect(fsPromises.readFile(plantedFilePath))
          .resolves
          .toEqual(expected)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#writeMediumFile()', () => {
    /*
     * The file is a caller's photograph, which the non-functional section classes as personal
     * data, and it sits in a directory every local account can list. Left to the process's umask
     * it was created `644` on a common server - readable by every one of them for the length of
     * the run.
     *
     * What this reads back is what the platform answers, which is the mode on a platform that has
     * one and a fixed number on a platform that has not. See the constant.
     */
    describe('should create the file for its owner alone', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440036,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440114,
            bytes: Buffer.from('balcony-view-bytes'),
          },
          expected: EXPECTED_MEDIUM_FILE_MODE,
        },
        {
          factoryParams: {
            aiRunId: 10440037,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            aiRunMediaId: 10440115,
            bytes: Buffer.from('parking-space-bytes'),
          },
          expected: EXPECTED_MEDIUM_FILE_MODE,
        },
      ]

      test.each(cases)('aiRunMediaId: $params.aiRunMediaId', async ({
        factoryParams,
        params,
        expected,
      }) => {
        /*
         * The same reason the sibling describe above clears before it writes: `writeMediumFile()`
         * opens with `wx`, so a copy a previous run of this suite left behind makes the second run
         * fail where the first passed. This root is this file's own -- no other test file names it
         * -- so clearing it whole is the arrange step, not a reach into somebody else's fixture.
         */
        await fsPromises.rm(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
          force: true,
        })

        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })

        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = await workspace.writeMediumFile(params)

        const mediumFileStatus = await fsPromises.stat(actual)
        const actualMode = mediumFileStatus.mode & PERMISSION_BITS

        expect(actualMode)
          .toBe(expected)
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#createWorkspaceDirectory()', () => {
    /*
     * A run writes up to twelve files through one workspace, and the workspace is claimed again on
     * every one of them - so a path this process has already made has to be let stand. That is why
     * an existing path is examined rather than refused outright.
     */
    describe('should let a directory it already made stand', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440038,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspacePath: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440038'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440038'),
        },
        {
          factoryParams: {
            aiRunId: 10440039,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspacePath: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440039'),
          },
          expected: path.join(TEST_WORKSPACE_ROOT_PATH, 'ai-run-media-10440039'),
        },
      ]

      test.each(cases)('workspacePath: $params.workspacePath', async ({
        factoryParams,
        params,
        expected,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        await fsPromises.rm(params.workspacePath, {
          recursive: true,
          force: true,
        })
        await fsPromises.mkdir(params.workspacePath)
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = await workspace.createWorkspaceDirectory(params)

        expect(actual)
          .toBe(expected)
      })
    })

    /*
     * Every failure that is not an existing path is raised as it arrived - a root that is not
     * there is the readiest of them, and it is also what says that no tree is built here.
     */
    describe('should raise a failure that is not an existing path', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440040,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspacePath: path.join(TEST_WORKSPACE_ROOT_PATH, 'no-such-root-10440040', 'ai-run-media-10440040'),
          },
        },
        {
          factoryParams: {
            aiRunId: 10440041,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspacePath: path.join(TEST_WORKSPACE_ROOT_PATH, 'no-such-root-10440041', 'ai-run-media-10440041'),
          },
        },
      ]

      test.each(cases)('workspacePath: $params.workspacePath', async ({
        factoryParams,
        params,
      }) => {
        await fsPromises.mkdir(TEST_WORKSPACE_ROOT_PATH, {
          recursive: true,
        })
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = () => workspace.createWorkspaceDirectory(params)

        await expect(actual)
          .rejects
          .toThrow('ENOENT')
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('#isOwnPrivateDirectory()', () => {
    /*
     * The statuses are stubs because the branches they drive cannot all be reached on one machine:
     * a status owned by another user is not something a test may create, and the permission bits
     * are a platform's to express. Every other case in this file runs against the real file
     * system; this one states the rule itself, and the planted-link cases above are it observed.
     *
     * The user id is stubbed alongside, so each case states the platform it is reasoning about
     * rather than inheriting the one the suite happens to run on.
     */
    describe('should refuse an entry it does not own', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440042,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => false,
              uid: 1000,
              mode: 0o40700,
            },
          },
          mockOwnUserId: 1000,
          label: 'a link rather than a directory',
        },
        {
          factoryParams: {
            aiRunId: 10440043,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => true,
              uid: 1001,
              mode: 0o40700,
            },
          },
          mockOwnUserId: 1000,
          label: 'a directory another account owns',
        },
        {
          factoryParams: {
            aiRunId: 10440044,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => true,
              uid: 1000,
              mode: 0o40777,
            },
          },
          mockOwnUserId: 1000,
          label: 'a directory open to every account on the host',
        },
        {
          factoryParams: {
            aiRunId: 10440045,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => false,
              uid: 0,
              mode: 0o40666,
            },
          },
          mockOwnUserId: null,
          label: 'a link, on a platform naming no user',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
        mockOwnUserId,
      }) => {
        jest.spyOn(AiRunMediaWorkspace, 'extractOwnUserId')
          .mockReturnValue(mockOwnUserId)
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = workspace.isOwnPrivateDirectory(/** @type {*} */ (params))

        expect(actual)
          .toBeFalsy()
      })
    })

    describe('should accept a directory of its own', () => {
      const cases = [
        {
          factoryParams: {
            aiRunId: 10440046,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => true,
              uid: 1000,
              mode: 0o40700,
            },
          },
          mockOwnUserId: 1000,
          label: 'a directory this account owns, open to nobody else',
        },
        {
          factoryParams: {
            aiRunId: 10440047,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => true,
              uid: 1000,
              mode: 0o40500,
            },
          },
          mockOwnUserId: 1000,
          label: 'a directory tightened further than this class asked for',
        },
        {
          /*
           * The residual the class comment states rather than claims closed: where the platform
           * names no user, a directory is accepted on the strength of its being a directory.
           */
          factoryParams: {
            aiRunId: 10440048,
            workspaceRootPath: TEST_WORKSPACE_ROOT_PATH,
          },
          params: {
            workspaceStatus: {
              isDirectory: () => true,
              uid: 0,
              mode: 0o40666,
            },
          },
          mockOwnUserId: null,
          label: 'a directory, on a platform naming no user',
        },
      ]

      test.each(cases)('label: $label', ({
        factoryParams,
        params,
        mockOwnUserId,
      }) => {
        jest.spyOn(AiRunMediaWorkspace, 'extractOwnUserId')
          .mockReturnValue(mockOwnUserId)
        const workspace = AiRunMediaWorkspace.create(factoryParams)

        const actual = workspace.isOwnPrivateDirectory(/** @type {*} */ (params))

        expect(actual)
          .toBeTruthy()
      })
    })
  })
})

describe('AiRunMediaWorkspace', () => {
  describe('.extractOwnUserId()', () => {
    /*
     * A platform without `process.getuid` answers null rather than a user id nobody has, which is
     * what lets the caller say which half of the claim check it is left with. The process is
     * stubbed so that the case states the platform rather than the suite's own.
     */
    describe('should extract what the platform names', () => {
      const cases = [
        {
          mockProcess: {
            getuid: () => 1000,
          },
          expected: 1000,
        },
        {
          mockProcess: {
            getuid: () => 0,
          },
          expected: 0,
        },
      ]

      test.each(cases)('expected user id: $expected', ({
        mockProcess,
        expected,
      }) => {
        jest.spyOn(AiRunMediaWorkspace, 'nodeProcess', 'get')
          .mockReturnValue(/** @type {*} */ (mockProcess))

        const actual = AiRunMediaWorkspace.extractOwnUserId()

        expect(actual)
          .toBe(expected)
      })
    })

    describe('should answer null where the platform names none', () => {
      test('with no getuid at all', () => {
        jest.spyOn(AiRunMediaWorkspace, 'nodeProcess', 'get')
          .mockReturnValue(/** @type {*} */ ({}))

        const actual = AiRunMediaWorkspace.extractOwnUserId()

        expect(actual)
          .toBeNull()
      })
    })
  })
})
