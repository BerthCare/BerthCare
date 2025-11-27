// **Feature: backend-ci-pipeline, Property 3: Integration Test Database Configuration**
// **Validates: Requirements 5.1, 5.2, 5.3**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const workflowPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'backend-ci.yml'
);

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');

const extractJobsSection = (content: string) => {
  const match = content.match(/jobs:\n([\s\S]*)/);
  expect(match).not.toBeNull();
  if (!match || !match[1]) {
    throw new Error('jobs section missing from workflow');
  }
  return match[1];
};

const extractJobBlock = (jobsSection: string, jobId: string) => {
  const jobRegex = new RegExp(
    `^ {2}${jobId}:\\n([\\s\\S]*?)(?=^ {2}(?! )[a-zA-Z0-9_-]+:|(?![\\s\\S]))`,
    'm'
  );
  const match = jobsSection.match(jobRegex);
  expect(match).not.toBeNull();
  if (!match || !match[1]) {
    throw new Error(`Job ${jobId} not found`);
  }
  return match[1];
};

describe('Feature: backend-ci-pipeline, Property 3: Integration Test Database Configuration', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('configures postgres service, DATABASE_URL, migrations, and integration test command', () => {
    const jobsSection = extractJobsSection(workflowContent);
    const integrationJob = extractJobBlock(jobsSection, 'integration-tests');

    const requiredPatterns = [
      /services:\s*\n\s{6}postgres:/,
      /image:\s*postgres:16/,
      /POSTGRES_USER:\s*postgres/,
      /POSTGRES_PASSWORD:\s*postgres/,
      /POSTGRES_DB:\s*berthcare_test/,
      /--health-cmd "pg_isready -U postgres"/,
      /--health-interval 10s/,
      /--health-timeout 5s/,
      /--health-retries 5/,
      /DATABASE_URL:\s*postgresql:\/\/postgres:postgres@localhost:5432\/berthcare_test\?schema=public/,
      /npm ci/,
      /npx prisma migrate deploy/,
      /npm run test:integration/,
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(requiredPatterns, {
          minLength: requiredPatterns.length,
          maxLength: requiredPatterns.length,
        }),
        (patterns: RegExp[]) => {
          patterns.forEach((pattern) => {
            expect(pattern.test(integrationJob)).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
