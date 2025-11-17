import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.eslintrc.js',
      'examples/**',
      'src/legacy-validator.js',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript-specific recommended rules
  ...tseslint.configs.recommended,

  // Disable style rules that conflict with Prettier
  eslintConfigPrettier,

  // Project-specific customizations
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022, // ES2022 features
      sourceType: 'module', // ES modules
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      // Allow 'any' with warning (transitional)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Don't require explicit return types (too verbose for CLI)
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Unused vars error, except underscore-prefixed
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // CLI tool needs console.log
      'no-console': 'off',
    },
  },
];
