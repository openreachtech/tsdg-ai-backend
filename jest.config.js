export default {
  /*
   * Jest's own default is 5000 ms, and the connection-release describes under
   * `tests/__tests__/app/aiRunMedia/` each spend up to 2000 ms of it waiting on a socket that must
   * not close. That leaves about 3000 ms, and a runner stall past it fails a test for a reason that
   * has nothing to do with what the test is about -- worst of all in the canary, whose own comment
   * says its red means a different thing entirely. A test read as a false alarm is a test somebody
   * skips.
   *
   * Raising the ceiling cannot make a passing test fail; it only costs a genuinely hung one longer
   * to report.
   */
  testTimeout: 15000,

  setupFilesAfterEnv: [
    '<rootDir>/tests/setup-after-env.js',
  ],
  moduleNameMapper: {
    '^(@.*)$': '<rootDir>/node_modules/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^sequelize/(.*)$': '<rootDir>/node_modules/sequelize/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
}
