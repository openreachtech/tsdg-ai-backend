import AiRunOperatorCommandLauncher from '../app/operatorCommand/AiRunOperatorCommandLauncher.js'

/*
 * The operator command of `#operator-cli`, and the whole of what this file does.
 *
 * `node scripts/readAiRuns.js <command> <parameter>` — four commands, each read-only:
 *
 *   stalled       <seconds>        runs running longer than that many seconds
 *   failed-since  <instant>        runs that failed since that moment
 *   run           <run key>        one run, with its steps in order
 *   correlation   <correlation id> every run under one correlation id
 *
 * **`NODE_ENV` comes from the caller and is not written here**, for the reason the scheduler
 * scripts give: the database this reads is the deployment's, so the deployment names it. Unset,
 * the environment barrel throws before anything connects, which is the right failure for a command
 * that is about to read a real database — better than quietly reading a developer's SQLite file
 * and reporting that no run is stalled.
 *
 *   NODE_ENV=production node scripts/readAiRuns.js stalled 300
 *
 * **Nothing under `app/operatorCommand/` imports `server/`, and this file does not either.** That
 * is the second use case of section 16 rather than a tidiness preference: an operator reads what
 * the runs are doing *while the API will not boot*, so no part of the path from this file to the
 * database may depend on the API being able to boot.
 *
 * **The work is in `AiRunOperatorCommandLauncher` and not in this file**, because a script is the
 * one thing in this repository that no test can call: importing it would run it, and running it
 * would exit the runner. So this file holds the two lines that cannot be tested — construct, and
 * start — and every decision they rest on sits in a class that is.
 */

const launcher = AiRunOperatorCommandLauncher.create()

await launcher.startCommandProcess()
