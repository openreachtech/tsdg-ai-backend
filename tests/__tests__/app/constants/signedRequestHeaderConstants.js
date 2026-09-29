import SIGNED_REQUEST_HEADER_CONSTANT_HASH from '../../../../app/constants/signedRequestHeaderConstants.js'

const {
  SIGNED_REQUEST_HEADER_NAME,
} = SIGNED_REQUEST_HEADER_CONSTANT_HASH

/*
 * The header names a signed request carries in either direction, read through the ESM bridge the
 * application imports — so the bridge resolving the CommonJS master is asserted by the same test
 * that asserts the values.
 *
 * The whole hash is compared in one go, because the names are a protocol a client has already
 * implemented against: a spelling changed here is a client that stops being able to sign, and a
 * name added is a header nobody on the other side knows to send. Neither should pass quietly.
 *
 * The three the contract fixes are asserted against the literals
 * `server/restfulapi/contexts/AppRestfulApiContext.js` verifies an inbound request by, because the
 * two spellings have to agree and that file still declares its own.
 */

describe('signedRequestHeaderConstants', () => {
  describe('SIGNED_REQUEST_HEADER_NAME', () => {
    describe('should declare the four names, and no other', () => {
      test('to be the whole hash', () => {
        const expected = { // Arrange
          CLIENT_ID: 'x-ort-client-id',
          TIMESTAMP: 'x-ort-timestamp',
          SIGNATURE: 'x-ort-signature',
          RUN_KEY: 'x-ort-run-key',
        }

        const actual = SIGNED_REQUEST_HEADER_NAME // Act

        expect(actual) // Assert
          .toEqual(expected)
      })
    })
  })
})
