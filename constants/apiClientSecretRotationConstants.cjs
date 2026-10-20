'use strict'

/*
 * What one secret-rotation command came to.
 *
 * Rotation is two commands and not one, because its two halves happen at different times. The
 * first issues a new secret and moves the live one into `previous_secret_ciphertext`, where
 * `ApiClientSignatureVerifier` goes on accepting it; the client then changes its configuration at
 * whatever hour suits it. The second clears that column, which is the moment the old secret stops
 * working. A single command could only do both at once, which is the one thing a rotation must not
 * do: it would refuse the client from the instant it ran until the instant the client was changed.
 *
 * They are a hash rather than free text because the launcher selects its report and its exit code
 * by the name. A misspelling in a free-text outcome would print the wrong sentence about a
 * credential, and print it confidently.
 *
 * **`ROTATION_ALREADY_UNDER_WAY` exists for safety rather than for reporting.** A second rotation
 * run before the first was retired would overwrite the secret being rotated out with the one the
 * client has only just been given - and a client still presenting the oldest secret is refused
 * from that moment, a lockout produced by the command that exists to prevent one. So the second
 * rotation is refused and the operator is told to retire first.
 *
 * **`NOTHING_TO_RETIRE` is not a failure.** Retiring a client that holds no previous secret is the
 * state the command was asked to produce, so asking twice is safe rather than exceptional - the
 * same reading the contract already gives a cancellation asked twice.
 */
module.exports = {
  API_CLIENT_SECRET_ROTATION_OUTCOME: {
    ROTATED: 'rotated',
    ROTATION_ALREADY_UNDER_WAY: 'rotation-already-under-way',
    RETIRED: 'retired',
    NOTHING_TO_RETIRE: 'nothing-to-retire',
    CLIENT_NOT_FOUND: 'client-not-found',
  },
}
