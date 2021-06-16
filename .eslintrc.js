module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
  },
  globals: {
    rootDir: true,
    include: true,
    jest: true,
    describe: true,
    it: true,
    expect: true,
  },
};
