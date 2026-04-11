// @ts-check
const js = require('@eslint/js')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const jestPlugin = require('eslint-plugin-jest')
const nPlugin = require('eslint-plugin-n')
const prettierConfig = require('eslint-config-prettier')
const globals = require('globals')

module.exports = [
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  jestPlugin.configs['flat/recommended'],
  prettierConfig,
  {
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.es2015
      }
    },
    plugins: {
      n: nPlugin
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {'ts-ignore': 'allow-with-description'}
      ],
      'no-console': 'error',
      yoda: 'error',
      'prefer-const': ['error', {destructuring: 'all'}],
      'no-control-regex': 'off',
      'no-constant-condition': ['error', {checkLoops: false}],
      'n/no-extraneous-import': 'error'
    }
  },
  {
    files: ['**/*{test,spec}.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'jest/no-standalone-expect': 'off',
      'jest/no-conditional-expect': 'off',
      'no-console': 'off'
    }
  }
]
