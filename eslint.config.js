import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  // Global ignores
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'build/**/*', '*.min.js'],
  },
  
  // Main configuration for TypeScript and TSX files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // AI-friendly rules for better code readability
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      
      // General code quality rules
      'no-console': 'off', // Allow console during development
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      
      // AI-friendly naming and structure rules
      'camelcase': ['warn', { properties: 'never', ignoreDestructuring: false }],
      'consistent-return': 'warn',
      'no-magic-numbers': ['off'], // Too strict for development
      'max-lines-per-function': ['off'], // Too strict for development  
      'max-depth': ['warn', 6],
      'max-params': ['warn', 7],
      
      // Import organization for better AI understanding
      'sort-imports': [
        'warn',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
      
      // Additional relaxed rules for development
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/consistent-indexed-object-style': 'warn',
      '@typescript-eslint/array-type': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      'no-case-declarations': 'warn',
    },
  },
  
  // Configuration for JavaScript files
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // Allow console during development
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  
  // Configuration for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/cypress/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'sort-imports': 'off',
      'no-duplicate-imports': 'off',
      'object-shorthand': 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off',
      'no-magic-numbers': 'off',
      'consistent-return': 'off',
    },
  },

  // Configuration for configuration files
  {
    files: ['**/*.config.{js,ts}', 'vite.config.ts', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'sort-imports': 'off',
    },
  },
]);
