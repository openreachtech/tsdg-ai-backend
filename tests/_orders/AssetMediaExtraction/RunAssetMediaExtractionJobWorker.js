import RunAssetMediaExtractionJobWorker from '../../../app/jobs/run-asset-media-extraction/RunAssetMediaExtractionJobWorker.js'

/*
 * `#executeAiRunWork()` - the one member `BaseAiRunJobWorker` leaves to a service, and the whole of
 * what this worker adds to a run's lifecycle.
 *
 * It sits here rather than under `tests/__tests__/` because placement follows what the method does:
 * the runner it hands the run to writes the run's media rows, its step trace and its field
 * outcomes. Standing that runner in does not move it - the every other member of this worker
 * decides rather than writes, and those are in the sibling file under `tests/__tests__/`.
 *
 * What is asserted is the delegation and nothing else. The six steps themselves are
 * `AssetMediaExtractionRunner`'s, run whole in the file beside this one; a second copy of them
 * driven through the worker would assert the same thing twice and fail in two places for one
 * reason.
 */

describe('RunAssetMediaExtractionJobWorker', () => {
  describe('#executeAiRunWork()', () => {
    /*
     * The body the base hands a work carries the manifest's declared fields and nothing else,
     * which for this job is the run's id alone - so the run is taken out of it by name, and the
     * cancellation signal is passed down untouched to the two steps that can stop on it.
     */
    describe('should hand the run to the runner', () => {
      const cases = [
        {
          params: {
            body: {
              aiRunId: 10630201,
            },
            context: {},
            parcel: {},
            signal: AbortSignal.timeout(60000),
          },
          mockResultBody: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10630201"}',
        },
        {
          params: {
            body: {
              aiRunId: 10630202,
            },
            context: {},
            parcel: {},
            signal: AbortSignal.timeout(30000),
          },
          mockResultBody: '{"fields":[],"missingFieldPaths":[],"unreadableMediaKeys":[],"mediaSignature":"media-signature-10630202"}',
        },
      ]

      test.each(cases)('aiRunId: $params.body.aiRunId', async ({
        params,
        mockResultBody,
      }) => {
        const worker = RunAssetMediaExtractionJobWorker.create({
          engine: {
            buildWorkerConfig: () => ({
              workersPath: '/alpha/jobs',
              connection: {},
            }),
            Error: {},
          },
        })
        const assetMediaExtractionRunner = {
          runAssetMediaExtraction: async () => mockResultBody,
        }
        const runAssetMediaExtractionSpy = jest.spyOn(assetMediaExtractionRunner, 'runAssetMediaExtraction')
        jest.spyOn(worker, 'createAssetMediaExtractionRunner')
          .mockReturnValue(/** @type {*} */ (assetMediaExtractionRunner))
        const expected = {
          aiRunId: params.body.aiRunId,
          signal: params.signal,
        }

        const actual = await worker.executeAiRunWork(params)

        expect(actual)
          .toBe(mockResultBody)
        expect(runAssetMediaExtractionSpy)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})
