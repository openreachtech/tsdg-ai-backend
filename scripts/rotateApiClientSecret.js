import ApiClientSecretRotationCommandLauncher from '../app/apiClient/ApiClientSecretRotationCommandLauncher.js'

/*
 * Issue one registered caller a new secret, and the whole of what this file does.
 *
 *   NODE_ENV=production node scripts/rotateApiClientSecret.js '<client key>'
 *
 * **Nothing is refused by running this.** The secret being replaced moves into the column
 * `ApiClientSignatureVerifier` reads second, so both are accepted and the client changes over at
 * an hour that suits it. What ends that window is the other half of the rotation:
 *
 *   NODE_ENV=production node scripts/retireApiClientPreviousSecret.js '<client key>'
 *
 * **A rotation left unretired is not a rotation.** Until that command runs, the secret this one
 * replaced still signs an acceptable request, so a credential somebody else may hold a copy of has
 * not actually been taken away.
 *
 * **`NODE_ENV` comes from the caller**, for the reason the registration command gives: the
 * database this writes to is the deployment's, so the deployment names it.
 *
 * **The work is in `ApiClientSecretRotationCommandLauncher` and not in this file**, because a
 * script is the one thing in this repository that no test can call: importing it would run it. So
 * this file holds the two lines that cannot be tested — construct, and start — and every decision
 * they rest on sits in a class that is.
 */

const launcher = ApiClientSecretRotationCommandLauncher.create()

await launcher.startCommandProcess()
