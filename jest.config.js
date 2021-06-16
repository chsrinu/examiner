module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/server/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!src/server/**/index.js',
  ],
};
