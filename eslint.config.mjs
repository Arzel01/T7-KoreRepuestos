import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/*.config.js', '**/*.config.cjs'],
  },

  js.configs.recommended,

  // TypeScript
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            'apps/backend/tsconfig.json',
            'apps/web/tsconfig.json',
            'packages/shared/tsconfig.json',
          ],
        },
        node: true,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-undef': 'off',
    },
  },

  // React (web)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...jsxA11yPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  // Tests
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Backend + DTOs — decorators usan imports de valor, no de tipo
  {
    files: ['apps/backend/**/*.ts', 'packages/shared/src/dto/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  prettierConfig,
];
