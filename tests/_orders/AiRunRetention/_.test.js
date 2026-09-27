/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * **Why #retention has a folder of its own rather than more files under `AiRun/`.** Every other
 * writer in this repository writes to the rows a caller named. A purge writes to every row past a
 * horizon, so it is the one kind of test here whose reach is not bounded by its own fixtures - and
 * `tests/_orders/AiRun/` is where the files that create runs from the auto-increment live, one of
 * which is read afterwards by the `#run-list` renderer's assertions on seven exact run keys. A
 * folder of its own makes the reach visible, and makes the isolation rule below one paragraph
 * rather than one line buried in a longer one.
 *
 * **The isolation rule, which every file here obeys and which is what keeps a sweep local.** Every
 * run this repository seeds, and every run any other test creates, is accepted in 2026. Every run
 * created here is accepted in 2017 or 2019, and every `now` handed to a purge puts its horizon in
 * the same years - so the set a sweep selects is exactly the rows of the describe that created
 * them. A file added here that accepts a run in 2026, or hands a purge a `now` in 2026 or later,
 * empties the content of every seeded run in the database, and the failures surface in other
 * folders as missing subject labels rather than here.
 *
 * **The files are order-independent, and each states why.** The two content files create runs
 * accepted in 2019 whose content stamp is null; the two trace files create runs accepted in 2017
 * whose content stamp is already set, which is both true of a run that has reached the two-year
 * horizon and what keeps those rows out of a content sweep's set. No file's horizons can reach
 * another file's rows in any order: the trace horizons all fall in 2017, before every run the
 * content files create, and the content sweeps exclude a run already stamped.
 *
 * **Two of the four test a purger and two test the job that runs it, and the split is the folder
 * placement rule rather than a preference.** `AiRunContentPurger.js` and `AiRunTracePurger.js` pin
 * what a purge does to the rows. `PurgeExpiredRunContentJobWorker.js` and
 * `PurgeExpiredRunTracesJobWorker.js` pin the one thing neither of those reaches - a worker built
 * the way the daemon builds one, with its own **default** purger, handed a real instant, and
 * actually purging. Each worker's read-only members stay in `tests/__tests__/app/jobs/`;
 * `#sweepExpiredAiRuns()` is here because it writes transitively, which is what decides placement.
 *
 * **Each file works in its own id block**, all inside #retention's: `11020001`, `11030001`,
 * `11040001` and `11050001` upward, and none is borrowed. Checkpoint 3's own file,
 * `tests/_orders/AiRun/AiRun.js`, holds `11010001` upward and stays where it is: what it pins is
 * what the schema accepts, not what a job does.
 */
import './AiRunContentPurger.js'
import './AiRunTracePurger.js'
import './PurgeExpiredRunContentJobWorker.js'
import './PurgeExpiredRunTracesJobWorker.js'
