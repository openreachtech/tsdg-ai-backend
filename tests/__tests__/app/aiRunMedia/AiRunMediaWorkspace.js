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
 * already returned.
 *
 * The run ids are this feature's own (`10440001` upward), so a directory this file creates belongs
 * to this file and to nothing else.
 */

const TEST_WORKSPACE_ROOT_PATH = path.join(os.tmpdir(), 'tsdg-ai-media-workspace-test')

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
