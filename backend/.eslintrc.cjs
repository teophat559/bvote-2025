module.exports = {
  root: true,
  env: { 
    node: true, 
    es2020: true 
  },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console in backend
    'no-undef': 'error',
  },
};
