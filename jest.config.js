module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  resolver: '<rootDir>/jest-resolver.js',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': ['ts-jest', {tsconfig: 'tsconfig.test.json'}],
    '^.+\\.js$': ['ts-jest', {tsconfig: 'tsconfig.test.json', diagnostics: false}]
  },
  transformIgnorePatterns: ['node_modules/(?!(@actions)/)'],
  verbose: true
}
