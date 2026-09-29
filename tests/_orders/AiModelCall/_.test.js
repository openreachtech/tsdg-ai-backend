/*
 * Imports define the run order for this category; add each new test in its correct position.
 *
 * The category is its own because model-call recording is its own area of write behavior: it
 * appends rows to `ai_model_calls` and to nothing else, and it reads no row any other category
 * writes. Nothing here changes what the run or the agent categories see, and nothing they do
 * changes what these tests see — the seeded runs and the seeded stub model are referenced by id,
 * which the schema holds without a database-level foreign key.
 */
import './AiModelCallRecorder.js'
