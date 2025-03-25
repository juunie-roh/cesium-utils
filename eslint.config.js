import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

/** @type {import('eslint').Linter.RulesRecord} */
export const baseRules = {
  'import/extensions': 'off',
  'no-param-reassign': 'off',
  'no-underscore-dangle': 'off',
  'prettier/prettier': [
    'error',
    {
      singleQuote: true,
      endOfLine: 'auto',
    },
  ],

  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/ban-tslint-comment': 'off',
  '@typescript-eslint/class-literal-property-style': 'off',
  '@typescript-eslint/consistent-generic-constructors': 'off',
  '@typescript-eslint/consistent-indexed-object-style': 'off',
  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-empty-interface': 'off',
  '@typescript-eslint/no-empty-object-type': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-inferrable-types': 'off',
  '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-shadow': 'off',
  '@typescript-eslint/no-this-alias': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-wrapper-object-types': 'off',
  '@typescript-eslint/triple-slash-reference': 'off',

  'no-restricted-syntax': [
    'error',
    'ForInStatement',
    'LabeledStatement',
    'WithStatement',
  ],
  'import/order': 'off',
  'import/refer-default-export': 'off',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'consistent-return': 'off',
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...eslint.configs.recommended,
    plugins: {
      jsdoc,
      prettier,
      '@typescript-eslint': tseslint,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: baseRules,
  },
];
