// **Feature: backend-dev-deployment, Property 2: Docker Build Configuration**
// **Validates: Requirements 2.1, 2.2**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const dockerfilePath = path.resolve(__dirname, '..', '..', 'Dockerfile');

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');

describe('Feature: backend-dev-deployment, Property 2: Docker Build Configuration', () => {
  const dockerfileContent = normalizeNewlines(readFileSync(dockerfilePath, 'utf8'));

  it('uses a multi-stage build with builder and production stages carrying compiled code and Prisma assets', () => {
    const builderIndex = dockerfileContent.indexOf('FROM node:20-alpine AS builder');
    const productionIndex = dockerfileContent.indexOf('FROM node:20-alpine AS production');

    expect(builderIndex).toBeGreaterThanOrEqual(0);
    expect(productionIndex).toBeGreaterThan(builderIndex);

    const requiredPatterns = [
      /FROM\s+node:20-alpine\s+AS\s+builder/,
      /RUN\s+npm ci/,
      /RUN\s+npm run build/,
      /RUN\s+npx prisma generate/,
      /FROM\s+node:20-alpine\s+AS\s+production/,
      /COPY\s+--from=builder\s+\/app\/node_modules\s+\.\/node_modules/,
      /COPY\s+--from=builder\s+\/app\/dist\s+\.\/dist/,
      /COPY\s+--from=builder\s+\/app\/prisma\s+\.\/prisma/,
      /EXPOSE\s+3000/,
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(requiredPatterns, {
          minLength: requiredPatterns.length,
          maxLength: requiredPatterns.length,
        }),
        (patterns) => {
          patterns.forEach((pattern) => {
            expect(pattern.test(dockerfileContent)).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
