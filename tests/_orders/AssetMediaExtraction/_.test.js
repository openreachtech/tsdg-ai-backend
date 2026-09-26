/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * The category is its own because the run's orchestration is its own area of write behavior: it
 * writes a run's media rows, its step trace and its field outcomes, all hung off runs it creates
 * itself in `#asset-media-extraction`'s `1063` sub-block. It borrows no seeded run, which it could
 * not: `ai_run_steps` is UNIQUE on `(AiRunId, step_index)` and `ai_run_field_outcomes` on
 * `(AiRunId, field_path)`, and the development seeder already hangs a trace off five of the seeded
 * runs. That is the trap Q69 records, and the rule it left behind - a test here creates the rows it
 * stands on.
 *
 * The order between the two files below states one thing: the runner runs first because it is what
 * the worker delegates to, so a failure there should read as the orchestration's own rather than as
 * the worker's. Neither reads a row the other writes - the worker's own file stands the runner in
 * entirely - so nothing else about their order carries meaning.
 *
 * Their run ids are disjoint from every other category's: the runner's are 10630101 upward and the
 * worker's 1063020x, both inside a sub-block no other file writes into.
 */
import './AssetMediaExtractionRunner.js'
import './RunAssetMediaExtractionJobWorker.js'
