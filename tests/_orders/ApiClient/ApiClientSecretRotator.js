import ApiClientSecretRotator from '../../../app/apiClient/ApiClientSecretRotator.js'

import ApiClientRegistrar from '../../../app/apiClient/ApiClientRegistrar.js'

import ApiClientSecretCipher from '../../../app/apiClient/ApiClientSecretCipher.js'

/*
 * The three members of the rotator that write a row. Everything it only decides, builds or reads is
 * beside the class in `tests/__tests__/app/apiClient/`.
 *
 * **Every client these tests touch is one they registered themselves.** Rotating a seeded row would
 * change the secret `.env.development` declares, which other tests sign requests with, and would do
 * it in whatever order the suites happened to run. So the fixtures here come from the real
 * registrar, and nothing depends on the rows they leave behind.
 *
 * **Nothing is mocked.** The cipher is real, the model is real, and the rows land in the real local
 * database, because the property worth proving is the one a stub would hide: that the envelope a
 * rotation moves into the previous column still decrypts to the secret that was live before it ran.
 * A rotation that scrambled that envelope would pass every assertion short of this one — a row
 * changed, two columns filled, an outcome reported — and would lock the client out the moment it
 * went on signing with the secret it already held.
 */

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    describe('should answer the new secret it issued', () => {
      const cases = [
        {
          params: {
            name: 'Rotation test client alpha',
            callbackUrlPrefix: 'https://alpha.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-04-05T06:07:08.009Z'),
          },
          expected: {
            outcomeName: 'rotated',
            secret: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/u),
          },
        },
        {
          params: {
            name: 'Rotation test client beta',
            callbackUrlPrefix: 'https://beta.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-05-06T07:08:09.010Z'),
          },
          expected: {
            outcomeName: 'rotated',
            secret: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/u),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    /*
     * The assertion the whole two-command shape rests on: the client goes on signing with the
     * secret it already holds, so that secret has to survive the move into the previous column
     * exactly as it was.
     */
    describe('should keep the previous secret decryptable as it was', () => {
      const cases = [
        {
          params: {
            name: 'Rotation test client gamma',
            callbackUrlPrefix: 'https://gamma.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-06-07T08:09:10.011Z'),
          },
        },
        {
          params: {
            name: 'Rotation test client delta',
            callbackUrlPrefix: 'https://delta.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-07-08T09:10:11.012Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        const saved = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })
        const cipher = ApiClientSecretCipher.create()

        const received = cipher.decryptSecret({
          envelope: saved.previousSecretCiphertext,
        })

        expect(received)
          .toBe(issued.secret)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    /*
     * The other half of the round trip: the secret the command printed is the secret the stored
     * envelope decrypts to. A client handed a value the row does not hold signs requests this
     * service refuses.
     */
    describe('should store a new secret that decrypts back to the one it handed over', () => {
      const cases = [
        {
          params: {
            name: 'Rotation test client epsilon',
            callbackUrlPrefix: 'https://epsilon.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-08-09T10:11:12.013Z'),
          },
        },
        {
          params: {
            name: 'Rotation test client zeta',
            callbackUrlPrefix: 'https://zeta.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-09-10T11:12:13.014Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        const rotated = await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        const saved = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })
        const cipher = ApiClientSecretCipher.create()

        const received = cipher.decryptSecret({
          envelope: saved.secretCiphertext,
        })

        expect(received)
          .toBe(rotated.secret)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    /*
     * A second rotation before the first was retired would discard the secret the client is still
     * signing with and leave the one it has only just been given in its place — a lockout produced
     * by the command that exists to avoid one.
     */
    describe('should refuse a client that is already mid-rotation', () => {
      const cases = [
        {
          params: {
            name: 'Rotation test client eta',
            callbackUrlPrefix: 'https://eta.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-10-11T12:13:14.015Z'),
          },
          expected: {
            outcomeName: 'rotation-already-under-way',
            secret: null,
          },
        },
        {
          params: {
            name: 'Rotation test client theta',
            callbackUrlPrefix: 'https://theta.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-11-12T13:14:15.016Z'),
          },
          expected: {
            outcomeName: 'rotation-already-under-way',
            secret: null,
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })

        const received = await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    /*
     * Refusing has to mean refusing. A guard that answered the refusal after writing would report
     * that nothing happened while the client's live secret had already been replaced.
     */
    describe('should leave the live secret untouched when it refuses', () => {
      const cases = [
        {
          params: {
            name: 'Rotation test client iota',
            callbackUrlPrefix: 'https://iota.rotations.example.com/callbacks/',
            registeredAt: new Date('2026-12-13T14:15:16.017Z'),
          },
        },
        {
          params: {
            name: 'Rotation test client kappa',
            callbackUrlPrefix: 'https://kappa.rotations.example.com/callbacks/',
            registeredAt: new Date('2027-01-14T15:16:17.018Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        const rotated = await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        const saved = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })
        const cipher = ApiClientSecretCipher.create()

        const received = cipher.decryptSecret({
          envelope: saved.secretCiphertext,
        })

        expect(received)
          .toBe(rotated.secret)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#rotateApiClientSecret()', () => {
    describe('should answer that no client holds an unissued key', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-never-issued-rotate-0001',
          },
          expected: {
            outcomeName: 'client-not-found',
            secret: null,
          },
        },
        {
          params: {
            clientKey: 'client-key-never-issued-rotate-0002',
          },
          expected: {
            outcomeName: 'client-not-found',
            secret: null,
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', async ({
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.rotateApiClientSecret(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#retirePreviousApiClientSecret()', () => {
    describe('should retire a client that is mid-rotation', () => {
      const cases = [
        {
          params: {
            name: 'Retirement test client alpha',
            callbackUrlPrefix: 'https://alpha.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-02-15T16:17:18.019Z'),
          },
          expected: {
            outcomeName: 'retired',
            secret: null,
          },
        },
        {
          params: {
            name: 'Retirement test client beta',
            callbackUrlPrefix: 'https://beta.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-03-16T17:18:19.020Z'),
          },
          expected: {
            outcomeName: 'retired',
            secret: null,
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })

        const received = await rotator.retirePreviousApiClientSecret({
          clientKey: issued.clientKey,
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#retirePreviousApiClientSecret()', () => {
    /*
     * The column is what the verifier reads second, so clearing it is the whole of what stops the
     * older secret being accepted. An outcome of `retired` over a column still filled would report
     * a credential withdrawn that still works.
     */
    describe('should clear the previous envelope', () => {
      const cases = [
        {
          params: {
            name: 'Retirement test client gamma',
            callbackUrlPrefix: 'https://gamma.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-04-17T18:19:20.021Z'),
          },
        },
        {
          params: {
            name: 'Retirement test client delta',
            callbackUrlPrefix: 'https://delta.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-05-18T19:20:21.022Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        await rotator.retirePreviousApiClientSecret({
          clientKey: issued.clientKey,
        })

        const received = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })

        expect(received.previousSecretCiphertext)
          .toBeNull()
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#retirePreviousApiClientSecret()', () => {
    /*
     * Asking twice is safe, which is what lets an operator run this without first working out
     * whether somebody already did.
     */
    describe('should answer that there is nothing to retire when no rotation is under way', () => {
      const cases = [
        {
          params: {
            name: 'Retirement test client epsilon',
            callbackUrlPrefix: 'https://epsilon.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-06-19T20:21:22.023Z'),
          },
          expected: {
            outcomeName: 'nothing-to-retire',
            secret: null,
          },
        },
        {
          params: {
            name: 'Retirement test client zeta',
            callbackUrlPrefix: 'https://zeta.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-07-20T21:22:23.024Z'),
          },
          expected: {
            outcomeName: 'nothing-to-retire',
            secret: null,
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.retirePreviousApiClientSecret({
          clientKey: issued.clientKey,
        })

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#retirePreviousApiClientSecret()', () => {
    /*
     * Retiring must never touch the secret the client is signing with now. It clears one column,
     * and the one it leaves is the one every request is verified against.
     */
    describe('should leave the live secret decryptable', () => {
      const cases = [
        {
          params: {
            name: 'Retirement test client eta',
            callbackUrlPrefix: 'https://eta.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-08-21T22:23:24.025Z'),
          },
        },
        {
          params: {
            name: 'Retirement test client theta',
            callbackUrlPrefix: 'https://theta.retirements.example.com/callbacks/',
            registeredAt: new Date('2027-09-22T23:24:25.026Z'),
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        const rotated = await rotator.rotateApiClientSecret({
          clientKey: issued.clientKey,
        })
        await rotator.retirePreviousApiClientSecret({
          clientKey: issued.clientKey,
        })
        const saved = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })
        const cipher = ApiClientSecretCipher.create()

        const received = cipher.decryptSecret({
          envelope: saved.secretCiphertext,
        })

        expect(received)
          .toBe(rotated.secret)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#retirePreviousApiClientSecret()', () => {
    describe('should answer that no client holds an unissued key', () => {
      const cases = [
        {
          params: {
            clientKey: 'client-key-never-issued-retire-0001',
          },
          expected: {
            outcomeName: 'client-not-found',
            secret: null,
          },
        },
        {
          params: {
            clientKey: 'client-key-never-issued-retire-0002',
          },
          expected: {
            outcomeName: 'client-not-found',
            secret: null,
          },
        },
      ]

      test.each(cases)('clientKey: $params.clientKey', async ({
        params,
        expected,
      }) => {
        const rotator = ApiClientSecretRotator.create()

        const received = await rotator.retirePreviousApiClientSecret(params)

        expect(received)
          .toEqual(expected)
      })
    })
  })
})

describe('ApiClientSecretRotator', () => {
  describe('#saveApiClientValues()', () => {
    /*
     * The write itself, exercised on its own so that a caller's test failing tells you which of
     * the two it was. Only the named column moves.
     */
    describe('should write the named column and leave the rest', () => {
      const cases = [
        {
          params: {
            name: 'Save test client alpha',
            callbackUrlPrefix: 'https://alpha.saves.example.com/callbacks/',
            registeredAt: new Date('2027-10-23T00:01:02.027Z'),
          },
          expected: {
            previousSecretCiphertext: 'envelope-written-0001',
          },
        },
        {
          params: {
            name: 'Save test client beta',
            callbackUrlPrefix: 'https://beta.saves.example.com/callbacks/',
            registeredAt: new Date('2027-11-24T01:02:03.028Z'),
          },
          expected: {
            previousSecretCiphertext: 'envelope-written-0002',
          },
        },
      ]

      test.each(cases)('name: $params.name', async ({
        params,
        expected,
      }) => {
        const registrar = ApiClientRegistrar.create()
        const issued = await registrar.registerApiClient(params)
        const rotator = ApiClientSecretRotator.create()
        const apiClient = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })
        await rotator.saveApiClientValues({
          apiClient,
          values: expected,
        })

        const received = await rotator.findSecretBearingApiClient({
          clientKey: issued.clientKey,
        })

        expect(received)
          .toEqual(expect.objectContaining(expected))
      })
    })
  })
})
