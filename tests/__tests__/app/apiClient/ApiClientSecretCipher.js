import ApiClientSecretCipher from '../../../../app/apiClient/ApiClientSecretCipher.js'

const UNUSABLE_ENCRYPTION_KEY_MESSAGE = 'API_CLIENT_SECRET_ENCRYPTION_KEY must be 64 hex characters, the 32 bytes AES-256-GCM takes'

describe('ApiClientSecretCipher', () => {
  describe('.buildEncryptionKey()', () => {
    describe('when the environment declares an AES-256 key', () => {
      const cases = [
        {
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          },
          expected: Buffer.from([
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
            0x01,
            0x23,
            0x45,
            0x67,
            0x89,
            0xAB,
            0xCD,
            0xEF,
          ]),
        },
        {
          input: {
            encryptionKeyText: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
          },
          expected: Buffer.from([
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
          ]),
        },
        {
          // hex written in upper case is the same key
          input: {
            encryptionKeyText: 'FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210',
          },
          expected: Buffer.from([
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
            0xFE,
            0xDC,
            0xBA,
            0x98,
            0x76,
            0x54,
            0x32,
            0x10,
          ]),
        },
      ]

      test.each(cases)('encryptionKeyText: $input.encryptionKeyText', ({
        input,
        expected,
      }) => {
        jest.spyOn(ApiClientSecretCipher, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({
            API_CLIENT_SECRET_ENCRYPTION_KEY: input.encryptionKeyText,
          }))

        const received = ApiClientSecretCipher.buildEncryptionKey()

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretCipher', () => {
  describe('.buildEncryptionKey()', () => {
    describe('when the environment declares no usable key', () => {
      /** @type {Array<{ label: string, input: { encryptionKeyText: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          label: 'a variable declared with an empty value',
          input: {
            encryptionKeyText: '', // what .env.live ships
          },
        },
        {
          label: 'a variable nobody declared',
          input: {
            encryptionKeyText: undefined,
          },
        },
        {
          label: 'a variable declared as nothing at all',
          input: {
            encryptionKeyText: null,
          },
        },
        {
          label: 'a key one character short of AES-256',
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde',
          },
        },
        {
          label: 'a key one character past AES-256',
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeff',
          },
        },
        {
          label: 'a key of an AES-128 length',
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef',
          },
        },
        {
          label: 'a key of the right length that is not hex',
          input: {
            encryptionKeyText: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg',
          },
        },
        {
          label: 'a passphrase somebody typed in place of a key',
          input: {
            encryptionKeyText: 'change-me-before-going-live',
          },
        },
      ])

      test.each(cases)('label: $label', ({
        input,
      }) => {
        jest.spyOn(ApiClientSecretCipher, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({
            API_CLIENT_SECRET_ENCRYPTION_KEY: input.encryptionKeyText,
          }))

        const received = () => ApiClientSecretCipher.buildEncryptionKey()

        expect(received)
          .toThrow(UNUSABLE_ENCRYPTION_KEY_MESSAGE)
      })
    })
  })
})

describe('ApiClientSecretCipher', () => {
  describe('.create()', () => {
    /*
     * The factory defaults its key to `.buildEncryptionKey()`, so a deployment holding an unusable
     * key is stopped at the first attempt to build a cipher — before a secret is encrypted, and
     * before a signature is checked against one that cannot be decrypted.
     */
    describe('when the environment declares no usable key', () => {
      /** @type {Array<{ label: string, input: { encryptionKeyText: * } }>} */
      const cases = /** @type {Array<*>} */ ([
        {
          label: 'a variable declared with an empty value',
          input: {
            encryptionKeyText: '',
          },
        },
        {
          label: 'a variable nobody declared',
          input: {
            encryptionKeyText: undefined,
          },
        },
      ])

      test.each(cases)('label: $label', ({
        input,
      }) => {
        jest.spyOn(ApiClientSecretCipher, 'env', 'get')
          .mockReturnValue(/** @type {*} */ ({
            API_CLIENT_SECRET_ENCRYPTION_KEY: input.encryptionKeyText,
          }))

        const received = () => ApiClientSecretCipher.create()

        expect(received)
          .toThrow(UNUSABLE_ENCRYPTION_KEY_MESSAGE)
      })
    })
  })
})
