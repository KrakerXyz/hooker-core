import krakerxyz from '@krakerxyz/eslint-config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
    ...krakerxyz,
    {
        ignores: ['*.config.mjs', '*.config.js', 'dist/**', 'node_modules/**']
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname
            }
        }
    }
];
