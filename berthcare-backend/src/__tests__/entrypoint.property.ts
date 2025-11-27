// **Feature: backend-dev-deployment, Property 6: Container Entrypoint with Migrations**
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const entrypointPath = path.resolve(__dirname, '..', '..', 'docker-entrypoint.sh');

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');

describe('Feature: backend-dev-deployment, Property 6: Container Entrypoint with Migrations', () => {
  const entrypointContent = normalizeNewlines(readFileSync(entrypointPath, 'utf8'));

  it('runs migrations with fail-fast semantics before starting the server', () => {
    const expectedPatterns = [
      /^#!\/bin\/sh/m,
      /^set -e$/m,
      /^npx prisma migrate deploy$/m,
      /^exec node dist\/index\.js/m,
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(expectedPatterns, {
          minLength: expectedPatterns.length,
          maxLength: expectedPatterns.length,
        }),
        (patterns) => {
          patterns.forEach((pattern) => {
            expect(pattern.test(entrypointContent)).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );

    const migrateIndex = entrypointContent.indexOf('npx prisma migrate deploy');
    const startIndex = entrypointContent.indexOf('exec node dist/index.js');
    expect(migrateIndex).toBeGreaterThanOrEqual(0);
    expect(startIndex).toBeGreaterThan(migrateIndex);

    expect(/prisma migrate reset/.test(entrypointContent)).toBe(false);
  });
});
