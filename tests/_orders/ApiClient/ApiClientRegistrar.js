import ApiClientRegistrar from '../../../app/apiClient/ApiClientRegistrar.js'

import ApiClientSecretCipher from '../../../app/apiClient/ApiClientSecretCipher.js'

/*
 * `#registerApiClient()` writes the row, so it is pinned here rather than beside the members that
 * only decide.
 *
 * **Nothing is mocked.** The cipher is the real one, the model is the real one, and the row lands in
 * the real local database, because the property worth proving is exactly the one a stub would hide:
 * that the secret handed back is the secret the stored envelope decrypts to. A client whose secret
 * does not survive that round trip signs requests this service refuses, and every assertion short
 * of it - a row exists, a key was returned - passes anyway.
 */

describe('ApiClientRegistrar', () => {
  describe('#registerApiClient()', () => {
    describe('should answer the two values the client needs', () => {
      const cases = [
        {
          params: {
            name: 'Order test client alpha',
            callbackUrlPrefix: 'https://alpha.orders.example.com/callbacks/',
            registeredAt: new Date('2026-04-05T06:07:08.009Z'),
          },
          expected: {
            clientKey: expect.stringMatching(/^[0-9a-f]{48}$/u),
            secret: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/u),
          },
        },
        {
          params: {
            name: 'Order test client beta',
            callbackUrlPrefix: 'https://beta.orders.example.com/callbacks/',
            registeredAt: new Date('2026-05-06T07:08:09.010Z'),
          },
          expected: {
            clientKey: expect.stringMatching(/^[0-9a-f]{48}$/u),
            secret: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/u),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()

        const received = await registrar.registerApiClient(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#registerApiClient()', () => {
    /*
     * The round trip, and the only assertion that says the client can actually sign.
     */
    describe('should store a secret that decrypts back to the one it handed over', () => {
      const cases = [
        {
          params: {
            name: 'Order test client gamma',
            callbackUrlPrefix: 'https://gamma.orders.example.com/callbacks/',
            registeredAt: new Date('2026-06-07T08:09:10.011Z'),
          },
        },
        {
          params: {
            name: 'Order test client delta',
            callbackUrlPrefix: 'https://delta.orders.example.com/callbacks/',
            registeredAt: new Date('2026-08-09T10:11:12.013Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const saved = await registrar.apiClientModel.unscoped()
          .findOne({
            where: {
              clientKey: issued.clientKey,
            },
          })
        const cipher = ApiClientSecretCipher.create()

        const received = cipher.decryptSecret({
          envelope: saved.secretCiphertext,
        })

        expect(received)
          .toBe(issued.secret)
      })
    })
  })
})

describe('ApiClientRegistrar', () => {
  describe('#registerApiClient()', () => {
    /*
     * A newly registered client is active and carries no rotating secret. Both are what the
     * signature filter reads before it verifies anything.
     */
    describe('should store the row the signature filter expects', () => {
      const cases = [
        {
          params: {
            name: 'Order test client epsilon',
            callbackUrlPrefix: 'https://epsilon.orders.example.com/callbacks/',
            registeredAt: new Date('2026-09-10T11:12:13.014Z'),
          },
          expected: {
            name: 'Order test client epsilon',
            callbackUrlPrefix: 'https://epsilon.orders.example.com/callbacks/',
            isActive: true,
            previousSecretCiphertext: null,
          },
        },
        {
          params: {
            name: 'Order test client zeta',
            callbackUrlPrefix: 'https://zeta.orders.example.com/callbacks/',
            registeredAt: new Date('2026-10-11T12:13:14.015Z'),
          },
          expected: {
            name: 'Order test client zeta',
            callbackUrlPrefix: 'https://zeta.orders.example.com/callbacks/',
            isActive: true,
            previousSecretCiphertext: null,
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)

        const received = await registrar.apiClientModel.unscoped()
          .findOne({
            where: {
              clientKey: issued.clientKey,
            },
          })

        expect(received)
          .toEqual(expect.objectContaining(expected))
      })
    })
  })
})
