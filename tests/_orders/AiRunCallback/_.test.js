/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * One file so far, and its position states nothing. `AiRunCallbackDeliveryRecorder` creates every
 * run it hangs an attempt off, in `#run-delivery`'s own id block, and borrows none — so it depends
 * on nothing in this folder having run before it, and leaves nothing another file here would read.
 *
 * It writes to `ai_run_callback_deliveries` only, and only against runs of its own, so it changes
 * nothing the development seeder's attempts answer for. The read-only half of the same class sits
 * under `tests/__tests__/` and runs before this folder does, so what it reads back is the fixture
 * as committed either way.
 */
import './AiRunCallbackDeliveryRecorder.js'
