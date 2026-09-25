/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * `AiRunAcceptor` writes rows of its own and reads none the renderer leaves behind, so it runs
 * first and the renderer's own writes cannot change what it sees. `BaseAiRunPostRenderer` reads
 * the runs `#run-contract` seeded as idempotency inputs, which is what that seeder is for.
 *
 * **The three recorders below are order-independent, and deliberately so.** Each creates the
 * `ai_runs` rows it stands on, in its own id block — `1021xxxx`, `1022xxxx`, `1023xxxx` — and
 * borrows none. Their position here carries no meaning and states no dependency.
 *
 * That is not a preference. `ai_run_steps` is UNIQUE on `(AiRunId, step_index)` and
 * `ai_run_field_outcomes` on `(AiRunId, field_path)`, and the development seeder already hangs a
 * trace off five of the seeded runs. When two of these files borrowed those runs instead, the
 * folder failed the first time it was run whole — four cases on `step_index must be unique` — while
 * each file passed alone. A test here creates the rows it stands on; the order below is for stating
 * a real dependency, never for keeping two independent files out of each other's way. See Q69.
 */
import './AiRunAcceptor.js'
import './BaseAiRunPostRenderer.js'
import './AiRunStatusRecorder.js'
import './AiRunStepRecorder.js'
import './AiRunFieldOutcomeRecorder.js'
