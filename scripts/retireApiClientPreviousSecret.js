import ApiClientPreviousSecretRetirementCommandLauncher from '../app/apiClient/ApiClientPreviousSecretRetirementCommandLauncher.js'

/*
 * Stop accepting the secret a rotation left behind, and the whole of what this file does.
 *
 *   NODE_ENV=production node scripts/retireApiClientPreviousSecret.js '<client key>'
 *
 * **Run it only once the client has confirmed it is signing with the new secret.** From the moment
 * it runs, the older one is refused — so running it early refuses a client that has not changed
 * over yet, which is the outage the two-command shape exists to avoid.
 *
 * **It prints no secret**, because it produces none: it clears a column. Its output is safe to
 * keep, unlike the registration and rotation commands'.
 *
 * **Asking twice is safe.** A client with nothing to retire is told so and the command succeeds.
 *
 * **The work is in `ApiClientPreviousSecretRetirementCommandLauncher` and not in this file**,
 * because a script is the one thing in this repository that no test can call: importing it would
 * run it. So this file holds the two lines that cannot be tested — construct, and start — and
 * every decision they rest on sits in a class that is.
 */

const launcher = ApiClientPreviousSecretRetirementCommandLauncher.create()

await launcher.startCommandProcess()
