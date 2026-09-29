import ApiClientRegistrationCommandLauncher from '../app/apiClient/ApiClientRegistrationCommandLauncher.js'

/*
 * Register one caller this service will accept signed requests from, and the whole of what this
 * file does.
 *
 *   NODE_ENV=production node scripts/registerApiClient.js '<name>' '<callback URL prefix>'
 *
 * **Until one client exists, a freshly built deployment answers nothing.** Every route runs the
 * signature filter, and the filter resolves a request's `x-ort-client-id` header to a row in
 * `api_clients`. Development seeds three such rows; production seeds none, deliberately, because
 * their secrets would then be values committed to a public repository.
 *
 * **`NODE_ENV` comes from the caller**, for the reason the operator command and the scheduler
 * scripts give: the database this writes to is the deployment's, so the deployment names it.
 *
 * **The work is in `ApiClientRegistrationCommandLauncher` and not in this file**, because a script
 * is the one thing in this repository that no test can call: importing it would run it. So this
 * file holds the two lines that cannot be tested — construct, and start — and every decision they
 * rest on sits in a class that is.
 */

const launcher = ApiClientRegistrationCommandLauncher.create()

await launcher.startCommandProcess()
