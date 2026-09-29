'use strict'

const TimestampSeedsSupplier = require('@openreachtech/renchan-sequelize/lib/tools/TimestampSeedsSupplier.cjs')

const env = require('../../../app/globals/env.cjs')

/*
 * Development fixtures: the registered callers a signed request is resolved to
 * (specs/1.0.0, #run-contract, `api_clients`).
 *
 * Three rows, one per branch the signature check takes, so each branch has something to read:
 *
 *   - 10000001 an active client holding one secret. A request signed with it is accepted, and
 *              one signed with anything else is refused.
 *   - 10000002 an active client mid-rotation, holding a live secret and the one being rotated
 *              out. A signature computed with either is accepted while the rotation is under way.
 *   - 10000003 a client switched off. Its secret is a real one and its signature verifies, so a
 *              refusal can only have come from `is_active` — which is the point of the row.
 *
 * Every secret is a value the environment declares, because two readers need the same one: this
 * seeder encrypts it, and a test signs a request with it. Each row carries its own, so a request
 * resolved to the wrong client fails to verify instead of passing unnoticed.
 *
 * The callback prefixes sit under the reserved `.invalid` domain, which never resolves, so a
 * delivery attempt escaping its stub in development reaches nothing.
 */

const TABLE_NAME = 'api_clients'

const apiClientSeeds = [
  {
    // success — one secret, no rotation under way
    id: 10000001,
    name: 'Development signing client',
    client_key: 'client-key-signing-10000001',
    raw_secret: env.DEVELOPMENT_API_CLIENT_SECRET,
    raw_previous_secret: null,
    callback_url_prefix: 'https://signing.client.development.invalid/callbacks/',
    is_active: true,
    registered_at: new Date('2026-09-01T01:02:03.004Z'),
  },
  {
    // success — a rotation under way, so two secrets are valid at once
    id: 10000002,
    name: 'Development rotating client',
    client_key: 'client-key-rotating-10000002',
    raw_secret: env.DEVELOPMENT_ROTATING_API_CLIENT_SECRET,
    raw_previous_secret: env.DEVELOPMENT_ROTATING_API_CLIENT_PREVIOUS_SECRET,
    callback_url_prefix: 'https://rotating.client.development.invalid/callbacks/',
    is_active: true,
    registered_at: new Date('2026-09-02T05:06:07.008Z'),
  },
  {
    // failure — switched off, so a well-signed request is still refused
    id: 10000003,
    name: 'Development switched off client',
    client_key: 'client-key-switched-off-10000003',
    raw_secret: env.DEVELOPMENT_INACTIVE_API_CLIENT_SECRET,
    raw_previous_secret: null,
    callback_url_prefix: 'https://switched-off.client.development.invalid/callbacks/',
    is_active: false,
    registered_at: new Date('2026-09-03T09:10:11.012Z'),
  },
]

/**
 * Create the cipher the stored secrets are encrypted by.
 *
 * `ApiClientSecretCipher` is an ES module and a seeder is CommonJS, so it is reached by a dynamic
 * import rather than `require`. Encrypting through it — rather than writing a literal envelope
 * into the row — leaves one implementation of the encryption, shared with the request path that
 * decrypts these columns again.
 *
 * @returns {Promise<import('../../../app/apiClient/ApiClientSecretCipher.js').default>} Cipher.
 */
async function createSecretCipher () {
  const {
    default: ApiClientSecretCipher,
  } = await import('../../../app/apiClient/ApiClientSecretCipher.js')

  return ApiClientSecretCipher.create()
}

/**
 * Fulfill a seed row, replacing the secrets it declares in the clear with the columns stored.
 *
 * @param {{
 *   seed: {[key: string]: *}
 *   cipher: import('../../../app/apiClient/ApiClientSecretCipher.js').default
 * }} params - Parameters.
 * @returns {{[key: string]: *}} Row to insert.
 */
function fulfillSecretCiphertexts ({
  seed,
  cipher,
}) {
  const {
    raw_secret: rawSecret,
    raw_previous_secret: rawPreviousSecret,
    ...storedFields
  } = seed

  const secretCiphertext = cipher.encryptSecret({
    secret: rawSecret,
  })

  const previousSecretCiphertext = generatePreviousSecretCiphertext({
    cipher,
    rawPreviousSecret,
  })

  return {
    ...storedFields,
    secret_ciphertext: secretCiphertext,
    previous_secret_ciphertext: previousSecretCiphertext,
  }
}

/**
 * Generate the column that holds the secret being rotated out, which only a rotating row has.
 *
 * @param {{
 *   cipher: import('../../../app/apiClient/ApiClientSecretCipher.js').default
 *   rawPreviousSecret: string | null
 * }} params - Parameters.
 * @returns {string | null} Envelope, or null when no rotation is under way.
 */
function generatePreviousSecretCiphertext ({
  cipher,
  rawPreviousSecret,
}) {
  if (rawPreviousSecret === null) {
    return null
  }

  return cipher.encryptSecret({
    secret: rawPreviousSecret,
  })
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cipher = await createSecretCipher()

    const fulfilledSeeds = apiClientSeeds.map(it =>
      fulfillSecretCiphertexts({
        seed: it,
        cipher,
      })
    )

    await queryInterface.bulkInsert(TABLE_NAME, TimestampSeedsSupplier.supplyAll(fulfilledSeeds), {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(TABLE_NAME, { id: apiClientSeeds.map(it => it.id) })
  },
}
