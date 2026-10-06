import DatabaseDialectOptionsBuilder from '../../../../sequelize/tools/DatabaseDialectOptionsBuilder.cjs'

describe('DatabaseDialectOptionsBuilder', () => {
  describe('constructor', () => {
    describe('should keep property', () => {
      describe('#databaseHost', () => {
        const cases = [
          {
            tally: '/cloudsql/example-project:asia-northeast1:example-db',
          },
          {
            tally: '127.0.0.1',
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('databaseHost: $tally', ({ tally }) => {
          const args = {
            databaseHost: tally,
            databaseSsl: null, // neutral value; not under test
            databaseSslCa: null, // neutral value; not under test
          }

          const received = new DatabaseDialectOptionsBuilder(args)

          expect(received)
            .toHaveProperty('databaseHost', tally)
        })
      })

      describe('#databaseSsl', () => {
        const cases = [
          {
            tally: 'true',
          },
          {
            tally: 'false',
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('databaseSsl: $tally', ({ tally }) => {
          const args = {
            databaseHost: '127.0.0.1', // neutral value; not under test
            databaseSsl: tally,
            databaseSslCa: null, // neutral value; not under test
          }

          const received = new DatabaseDialectOptionsBuilder(args)

          expect(received)
            .toHaveProperty('databaseSsl', tally)
        })
      })

      describe('#databaseSslCa', () => {
        const cases = [
          {
            tally: 'certificate-authority-0001',
          },
          {
            tally: 'certificate-authority-0002',
          },
          {
            tally: null,
          },
        ]

        test.each(cases)('databaseSslCa: $tally', ({ tally }) => {
          const args = {
            databaseHost: '127.0.0.1', // neutral value; not under test
            databaseSsl: null, // neutral value; not under test
            databaseSslCa: tally,
          }

          const received = new DatabaseDialectOptionsBuilder(args)

          expect(received)
            .toHaveProperty('databaseSslCa', tally)
        })
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'true',
            databaseSslCa: 'certificate-authority-0001',
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input }) => {
        const received = DatabaseDialectOptionsBuilder.create(input)

        expect(received)
          .toBeInstanceOf(DatabaseDialectOptionsBuilder)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          tally: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
            databaseSsl: 'false',
            databaseSslCa: 'certificate-authority-0001',
          },
        },
        {
          tally: {
            databaseHost: 'db.example.com',
            databaseSsl: 'true',
            databaseSslCa: 'certificate-authority-0002',
          },
        },
      ]

      test.each(cases)('databaseHost: $tally.databaseHost', ({ tally }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(DatabaseDialectOptionsBuilder)

        SpyClass.create(tally)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(tally)
      })
    })

    describe('should fill default value', () => {
      const cases = [
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'true',
            // databaseSslCa: omitted → default null
          },
          expected: {
            databaseHost: 'db.example.com',
            databaseSsl: 'true',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            // databaseSsl: omitted → default null
            databaseSslCa: 'certificate-authority-0001',
          },
          expected: {
            databaseHost: 'db.example.com',
            databaseSsl: null,
            databaseSslCa: 'certificate-authority-0001',
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            // databaseSsl: omitted → default null
            // databaseSslCa: omitted → default null
          },
          expected: {
            databaseHost: 'db.example.com',
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
      ]

      test.each(cases)('databaseSsl: $expected.databaseSsl, databaseSslCa: $expected.databaseSslCa', ({ input, expected }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(DatabaseDialectOptionsBuilder)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(expected)
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#buildDialectOptions()', () => {
    describe('when the host is a unix socket path', () => {
      const cases = [
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
            databaseSsl: null,
            databaseSslCa: null,
          },
          expected: {
            socketPath: '/cloudsql/example-project:asia-northeast1:example-db',
          },
        },
        {
          input: {
            databaseHost: '/var/run/mysqld/mysqld.sock',
            databaseSsl: 'false',
            databaseSslCa: 'certificate-authority-0001', // carried but never reached
          },
          expected: {
            socketPath: '/var/run/mysqld/mysqld.sock',
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input, expected }) => {
        const builder = DatabaseDialectOptionsBuilder.create(input)

        const received = builder.buildDialectOptions()

        expect(received)
          .toEqual(expected)
      })
    })

    describe('when the host is a network host and TLS is not asked for', () => {
      const cases = [
        {
          input: {
            databaseHost: '127.0.0.1',
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'false',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'cloudsql/example-project:asia-northeast1:example-db', // no leading slash: a name, not a path
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'false',
            databaseSslCa: 'certificate-authority-0001', // an authority alone turns nothing on
          },
        },
        {
          input: {
            databaseHost: '',
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: null,
            databaseSsl: null,
            databaseSslCa: null,
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost, databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create(input)

        const received = builder.buildDialectOptions()

        expect(received)
          .toEqual({})
      })
    })

    describe('when the host is a network host and TLS is asked for', () => {
      const cases = [
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'true',
            databaseSslCa: null,
          },
          expected: {
            ssl: {
              rejectUnauthorized: true,
            },
          },
        },
        {
          input: {
            databaseHost: '127.0.0.1',
            databaseSsl: ' true ', // a platform-supplied value carries padding
            databaseSslCa: 'certificate-authority-0001',
          },
          expected: {
            ssl: {
              ca: 'certificate-authority-0001',
              rejectUnauthorized: true,
            },
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost, databaseSslCa: $input.databaseSslCa', ({ input, expected }) => {
        const builder = DatabaseDialectOptionsBuilder.create(input)

        const received = builder.buildDialectOptions()

        expect(received)
          .toStrictEqual(expected)
      })
    })

    describe('when TLS is asked for over a unix socket', () => {
      const expected = 'DATABASE_SSL must not be `true` while DATABASE_HOST names a unix socket. A socket connection never leaves the host, so there is no transport for TLS to protect and the driver would be asked to negotiate it over a path that does not offer it. Declaring both is a contradiction rather than extra caution, and it is refused here instead of being dropped quietly — a setting that is ignored still reads, to whoever set it, as a setting that took effect.'

      const cases = [
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
            databaseSsl: 'true',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: '/var/run/mysqld/mysqld.sock',
            databaseSsl: 'true',
            databaseSslCa: 'certificate-authority-0001',
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create(input)

        expect(() => builder.buildDialectOptions())
          .toThrow(expected)
      })
    })

    describe('when TLS is declared unusably', () => {
      const expected = 'DATABASE_SSL must be either `true`, `false`, or unset. It is read as those three words and nothing else, because every other way of reading it turns a misspelling into a silent `false`: a deployment that believes it asked for an encrypted connection and did not get one is worse off than one that never asked, and the difference is invisible from the outside.'

      const cases = [
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'TRUE', // the comparison is exact, not case-insensitive
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'yes',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: '1',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: 'db.example.com',
            databaseSsl: 'ture', // a misspelling refuses instead of reading as false
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db', // the socket branch asks too
            databaseSsl: 'yes',
            databaseSslCa: null,
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost, databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create(input)

        expect(() => builder.buildDialectOptions())
          .toThrow(expected)
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#buildSslOptions()', () => {
    describe('with TLS asked for', () => {
      const cases = [
        {
          input: {
            databaseSsl: 'true',
            databaseSslCa: null,
          },
          expected: {
            ssl: {
              rejectUnauthorized: true,
            },
          },
        },
        {
          input: {
            databaseSsl: 'true',
            databaseSslCa: 'certificate-authority-0001',
          },
          expected: {
            ssl: {
              ca: 'certificate-authority-0001',
              rejectUnauthorized: true,
            },
          },
        },
      ]

      test.each(cases)('databaseSslCa: $input.databaseSslCa', ({ input, expected }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: input.databaseSslCa,
        })

        const received = builder.buildSslOptions()

        expect(received)
          .toStrictEqual(expected)
      })
    })

    describe('without TLS asked for', () => {
      const cases = [
        {
          input: {
            databaseSsl: 'false',
            databaseSslCa: null,
          },
        },
        {
          input: {
            databaseSsl: null,
            databaseSslCa: 'certificate-authority-0001',
          },
        },
      ]

      test.each(cases)('databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: input.databaseSslCa,
        })

        const received = builder.buildSslOptions()

        expect(received)
          .toStrictEqual({})
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#buildCertificateAuthorityOptions()', () => {
    describe('with an authority declared', () => {
      const cases = [
        {
          tally: 'certificate-authority-0001',
        },
        {
          tally: 'certificate-authority-0002',
        },
      ]

      test.each(cases)('databaseSslCa: $tally', ({ tally }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: 'true', // neutral value; not under test
          databaseSslCa: tally,
        })

        const received = builder.buildCertificateAuthorityOptions()

        expect(received)
          .toStrictEqual({
            ca: tally,
          })
      })
    })

    describe('without an authority declared', () => {
      const cases = [
        {
          input: {
            databaseSslCa: '',
          },
        },
        {
          input: {
            databaseSslCa: null,
          },
        },
      ]

      test.each(cases)('databaseSslCa: $input.databaseSslCa', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: 'true', // neutral value; not under test
          databaseSslCa: input.databaseSslCa,
        })

        const received = builder.buildCertificateAuthorityOptions()

        expect(received)
          .toStrictEqual({})
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#usesSsl()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            databaseSsl: 'true',
          },
        },
        {
          input: {
            databaseSsl: ' true ', // trimmed before it is read
          },
        },
        {
          input: {
            databaseSsl: '\ttrue\n',
          },
        },
      ]

      test.each(cases)('databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.usesSsl()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            databaseSsl: 'false',
          },
        },
        {
          input: {
            databaseSsl: ' ', // whitespace alone declares nothing
          },
        },
        {
          input: {
            databaseSsl: '',
          },
        },
        {
          input: {
            databaseSsl: null,
          },
        },
      ]

      test.each(cases)('databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.usesSsl()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#normalizeSslDeclaration()', () => {
    describe('with a usable declaration', () => {
      const cases = [
        {
          input: {
            databaseSsl: 'true',
          },
          expected: 'true',
        },
        {
          input: {
            databaseSsl: 'false',
          },
          expected: 'false',
        },
        {
          input: {
            databaseSsl: ' true ',
          },
          expected: 'true',
        },
        {
          input: {
            databaseSsl: '\nfalse\t',
          },
          expected: 'false',
        },
        {
          input: {
            databaseSsl: '   ',
          },
          expected: '',
        },
        {
          input: {
            databaseSsl: '',
          },
          expected: '',
        },
        {
          input: {
            databaseSsl: null,
          },
          expected: '',
        },
      ]

      test.each(cases)('databaseSsl: $input.databaseSsl', ({ input, expected }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.normalizeSslDeclaration()

        expect(received)
          .toBe(expected)
      })
    })

    describe('with an unusable declaration', () => {
      const expected = 'DATABASE_SSL must be either `true`, `false`, or unset. It is read as those three words and nothing else, because every other way of reading it turns a misspelling into a silent `false`: a deployment that believes it asked for an encrypted connection and did not get one is worse off than one that never asked, and the difference is invisible from the outside.'

      const cases = [
        {
          input: {
            databaseSsl: 'TRUE',
          },
        },
        {
          input: {
            databaseSsl: 'False',
          },
        },
        {
          input: {
            databaseSsl: 'yes',
          },
        },
        {
          input: {
            databaseSsl: '0',
          },
        },
        {
          input: {
            databaseSsl: 'true false',
          },
        },
      ]

      test.each(cases)('databaseSsl: $input.databaseSsl', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: 'db.example.com', // neutral value; not under test
          databaseSsl: input.databaseSsl,
          databaseSslCa: null, // neutral value; not under test
        })

        expect(() => builder.normalizeSslDeclaration())
          .toThrow(expected)
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#buildSocketOptions()', () => {
    describe('without TLS asked for', () => {
      const cases = [
        {
          tally: '/cloudsql/example-project:asia-northeast1:example-db',
        },
        {
          tally: '/var/run/mysqld/mysqld.sock',
        },
      ]

      test.each(cases)('databaseHost: $tally', ({ tally }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: tally,
          databaseSsl: 'false', // neutral value; not under test
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.buildSocketOptions()

        expect(received)
          .toStrictEqual({
            socketPath: tally,
          })
      })
    })

    describe('with TLS asked for', () => {
      const expected = 'DATABASE_SSL must not be `true` while DATABASE_HOST names a unix socket. A socket connection never leaves the host, so there is no transport for TLS to protect and the driver would be asked to negotiate it over a path that does not offer it. Declaring both is a contradiction rather than extra caution, and it is refused here instead of being dropped quietly — a setting that is ignored still reads, to whoever set it, as a setting that took effect.'

      const cases = [
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
          },
        },
        {
          input: {
            databaseHost: '/var/run/mysqld/mysqld.sock',
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: input.databaseHost,
          databaseSsl: 'true',
          databaseSslCa: null, // neutral value; not under test
        })

        expect(() => builder.buildSocketOptions())
          .toThrow(expected)
      })
    })
  })
})

describe('DatabaseDialectOptionsBuilder', () => {
  describe('#isSocketPath()', () => {
    describe('should be truthy', () => {
      const cases = [
        {
          input: {
            databaseHost: '/cloudsql/example-project:asia-northeast1:example-db',
          },
        },
        {
          input: {
            databaseHost: '/var/run/mysqld/mysqld.sock',
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: input.databaseHost,
          databaseSsl: null, // neutral value; not under test
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.isSocketPath()

        expect(received)
          .toBeTruthy()
      })
    })

    describe('should be falsy', () => {
      const cases = [
        {
          input: {
            databaseHost: '127.0.0.1',
          },
        },
        {
          input: {
            databaseHost: 'cloudsql/example-project:asia-northeast1:example-db',
          },
        },
        {
          input: {
            databaseHost: '',
          },
        },
        {
          input: {
            databaseHost: null,
          },
        },
      ]

      test.each(cases)('databaseHost: $input.databaseHost', ({ input }) => {
        const builder = DatabaseDialectOptionsBuilder.create({
          databaseHost: input.databaseHost,
          databaseSsl: null, // neutral value; not under test
          databaseSslCa: null, // neutral value; not under test
        })

        const received = builder.isSocketPath()

        expect(received)
          .toBeFalsy()
      })
    })
  })
})
