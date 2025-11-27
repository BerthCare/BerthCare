// **Feature: backend-ci-pipeline, Property 5: ESLint Configuration Validity**
// **Validates: Requirements 2.1**

import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fc from 'fast-check';

type FlatConfigEntry = {
  files?: string[];
  ignores?: string[];
  plugins?: Record<string, unknown>;
  languageOptions?: {
    parserOptions?: { project?: string };
    globals?: Record<string, unknown>;
  };
};

const configPath = path.resolve(__dirname, '..', '..', 'eslint.config.js');
const tsSourceGlob = 'src/**/*.ts';
const ignoredGlobs = ['dist/**', 'src/generated/**'] as const;

const isFlatConfigArray = (value: unknown): value is FlatConfigEntry[] => Array.isArray(value);

describe('Feature: backend-ci-pipeline, Property 5: ESLint Configuration Validity', () => {
  it('focuses on TypeScript sources while excluding generated outputs', async () => {
    expect(existsSync(configPath)).toBe(true);

    const configModule: unknown = await import(configPath);
    const rawConfig = (configModule as { default?: unknown }).default ?? configModule;
    if (!isFlatConfigArray(rawConfig)) {
      throw new Error('ESLint config should export an array');
    }

    const config = rawConfig;

    const ignoreEntry = config.find((entry) => Array.isArray(entry.ignores));
    expect(ignoreEntry?.ignores).toEqual(expect.arrayContaining(ignoredGlobs));

    const tsConfigs = config.filter((entry) => entry.files?.includes(tsSourceGlob));
    expect(tsConfigs.length).toBeGreaterThan(0);

    const pluginCovered = tsConfigs.some(
      (entry) =>
        entry.plugins && Object.prototype.hasOwnProperty.call(entry.plugins, '@typescript-eslint')
    );
    expect(pluginCovered).toBe(true);

    const typeAwareConfig = tsConfigs.find(
      (entry) => entry.languageOptions?.parserOptions?.project
    );
    expect(typeAwareConfig?.languageOptions?.parserOptions?.project).toBe('./tsconfig.json');

    fc.assert(
      fc.property(fc.constantFrom(...tsConfigs), (entry) => {
        expect(entry.files).toContain(tsSourceGlob);

        if (entry.languageOptions?.globals) {
          const globals = entry.languageOptions.globals;
          expect('process' in globals).toBe(true);
        }
      }),
      { numRuns: tsConfigs.length }
    );
  });
});
