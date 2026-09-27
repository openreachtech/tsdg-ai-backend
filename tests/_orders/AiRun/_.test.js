/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * `AiRunAcceptor` writes rows of its own and reads none the renderer leaves behind, so it runs
 * first and the renderer's own writes cannot change what it sees. `BaseAiRunPostRenderer` reads
 * the runs `#run-contract` seeded as idempotency inputs, which is what that seeder is for.
 *
 * `AssetMediaExtractionPostRenderer` follows it for the same reason `BaseAiRunPostRenderer` is
 * where it is: it creates its runs through the acceptor and takes their ids from the
 * auto-increment, so it belongs above every file that writes an explicit id. It borrows no seeded
 * run — each of its cases carries an idempotency key of its own, in `#asset-media-extraction`'s
 * own block — so its position relative to the three recorders below states nothing.
 *
 * It does read the seeded runs, without writing one: its rate-limit cases count how many runs a
 * seeded client already has inside 2026-09-10, which is the day the `ai_runs` fixture was seeded on
 * and the day no test in this repository writes into. The runs it creates itself are accepted on
 * 2026-10-12, well clear of that day, so nothing it writes can move a count it or any read-only
 * test asserts. A file added anywhere that accepts a run on 2026-09-10 breaks that, and is the one
 * change this paragraph exists to catch.
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
 *
 * `BaseAiRunJobWorker` is order-independent for a different reason again: it hands the worker a
 * recorder of its own, so it writes no row at all. It sits in this folder rather than under
 * `tests/__tests__/` because placement follows what the method does — the lifecycle it exercises
 * writes to `ai_runs` — and not whether a test stubs the write away.
 *
 * What it does read, since `#run-cancel`, is one column of a run that is not there: the delivery
 * asks whether a client has stopped caring before it begins the work, and the ids that file names
 * carry no row. The answer is the same as for a run nobody asked about, so nothing above or below
 * it can change what that file sees, and it changes nothing for them.
 *
 * `AiRunJobDispatchRegistrar` sits below every file that takes its ids from the auto-increment,
 * and that position does state something. It creates its runs with explicit ids in
 * `#run-execution`'s own block (`10310001` upward), which is higher than every id the files above
 * it write; the two files that create runs through the acceptor and the renderer take their ids
 * from the auto-increment, so they go first and are never handed an id this file has already
 * pushed the sequence past.
 *
 * `#run-cancel`'s two files are last for the same reason and state the same thing. They create
 * runs with explicit ids in their own block (`10810001` upward), higher again than everything
 * above them, so nothing that takes an id from the auto-increment can run afterwards and collide.
 * Their position relative to each other carries no meaning: each creates the rows it stands on, in
 * a sub-block of its own — `10810001` and `10820001` upward for the registrar, `10830001` upward
 * for the renderer — and neither borrows a run of the other's or a seeded one. Both write only
 * `cancel_requested_at`, and only onto runs they created themselves, so no file above them reads a
 * row either of them has touched.
 *
 * `AiRunCancellationWatcher` is last, and its position states the same thing a third time: it
 * creates runs with explicit ids in that feature's own block (`10840001` upward), higher than
 * everything written anywhere in this folder, so nothing taking an id from the auto-increment may
 * run after it. Its position relative to the two files above it carries no meaning — it creates the
 * two runs it watches and borrows none — and `cancel_requested_at` is the only column it writes.
 *
 * `BaseAiRunJobWorkerCancellation` is the last of all, and its position is the only one in this
 * folder that had to move something. It is the cancellation half of `BaseAiRunJobWorker`'s
 * lifecycle, and unlike that file it runs the recorder for real — so it creates `ai_runs` rows with
 * explicit ids, in `#run-cancel`'s own block (`10870001` upward), which is higher than every id
 * written anywhere above it. That is why it is a file of its own rather than more describes in
 * `BaseAiRunJobWorker.js`: that file writes no row at all and so may sit seventh, and adding these
 * cases to it would have put explicit ids above three files that take theirs from the
 * auto-increment. Its runs are accepted in November 2026, clear of 2026-09-10.
 *
 * `#run-cancel` writes into `AiRunStatusRecorder.js` as well, in `10850001` upward, for the
 * answering spelling of the cancellation transition. That block is above every id written in this
 * folder too, and it is written from the fourth position rather than the last only because that
 * file is where the class's other transitions are already asserted — the three files above it are
 * the ones taking ids from the auto-increment, and all three have run by then.
 *
 * `AiRun.js` is the last of all, and its position states the same thing once more. It is
 * #retention's own file, it creates the four runs it purges with explicit ids in that feature's
 * block (`11010001` upward) — higher than every id written anywhere above it — and it borrows
 * neither a seeded run nor a run of any other file's. Its runs are accepted in November 2026,
 * clear of 2026-09-10. It is a file named for the model rather than for a class of its own because
 * the member it exercises is the model's: what a purge writes onto a run is `AiRun#update()` and
 * `AiRun.update()`, and the guard that write has to pass is this model's own hook. The jobs that
 * will make those writes are checkpoints of their own and are not here.
 */
import './AiRunAcceptor.js'
import './BaseAiRunPostRenderer.js'
import './AssetMediaExtractionPostRenderer.js'
import './AiRunStatusRecorder.js'
import './AiRunStepRecorder.js'
import './AiRunFieldOutcomeRecorder.js'
import './BaseAiRunJobWorker.js'
import './AiRunJobDispatchRegistrar.js'
import './AssetMediaReadingFetcher.js'
import './AiRunCancellationRegistrar.js'
import './AiRunCancellationPostRenderer.js'
import './AiRunCancellationWatcher.js'
import './BaseAiRunJobWorkerCancellation.js'
import './AiRun.js'
