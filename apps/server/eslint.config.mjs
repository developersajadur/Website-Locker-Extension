import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Files to lint
  { files: ['src/**/*.{js,mjs,cjs,ts}'] },

  // Global ignores — files excluded from tsconfig must be ignored here too
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'prisma.config.ts',
      'eslint.config.mjs',
      '*.config.js',
      '*.config.cjs',
      'prisma/**',
    ],
  },

  // Language options — only parse files inside src/ with the TS project
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      'no-unused-vars': 'warn',
      'no-unused-expressions': 'error',
      'prefer-const': 'warn',
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
