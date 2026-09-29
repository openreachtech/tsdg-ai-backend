/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * Three files, and their order states one thing: every file here creates the runs it hangs its
 * attempts off, in `#run-delivery`'s own id block, and borrows none. `ai_run_callback_deliveries`
 * is UNIQUE on `(AiRunId, AiRunCallbackDeliveryCategoryId, attempt_index)`, so a file writing onto
 * another's run would be two writers competing for one triple — none of them does, and each id
 * block below is disjoint: the recorder's ids begin at 10530011 and the worker's at 10530031, and
 * the deliverer holds the block between them and the one after them, 10530021 to 10530029 and
 * 10530041 upward.
 *
 * The recorder runs first because it is the member the two files after it record through: a
 * failure there should read as the recorder's own, not as the orchestration's. The deliverer runs
 * before the worker for the same reason — the worker is the deliverer plus the queue's attempt
 * number, so a deliverer that is already green narrows what a worker failure can be.
 *
 * None of them touches the development seeder's own attempts, which hang off the seeded runs, so
 * the read-only halves under `tests/__tests__/` answer for the fixture as committed either way.
 */
import './AiRunCallbackDeliveryRecorder.js'
import './AiRunTerminalCallbackDeliverer.js'
import './DeliverRunCallbackJobWorker.js'
