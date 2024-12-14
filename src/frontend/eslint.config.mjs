import { FlatCompat } from '@eslint/eslintrc';

// declare compat as suggested in https://github.com/vercel/next.js/issues/64114#issuecomment-2440625243
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/** @type {import('eslint').Linter.Config} */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['src/declarations'],
  },
];

export default eslintConfig;
