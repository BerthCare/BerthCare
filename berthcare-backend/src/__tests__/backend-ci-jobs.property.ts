// **Feature: backend-ci-pipeline, Property 2: Required CI Jobs Presence**
// **Validates: Requirements 2.1, 3.1, 4.1, 6.1**

import { readFileSync } from 'node:fs';
import path from 'node:path';

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
  if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    throw new Error(`Invalid jobId: ${jobId}`);
  }
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

describe('Feature: backend-ci-pipeline, Property 2: Required CI Jobs Presence', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('ensures lint, typecheck, unit test, and prisma validate jobs exist with key steps', () => {
    const requiredJobs: { id: string; patterns: RegExp[] }[] = [
      {
        id: 'lint',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*10/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
          /npm ci/,
          /npm run lint/,
        ],
      },
      {
        id: 'typecheck',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*10/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
          /npm ci/,
          /npm run type-check/,
        ],
      },
      {
        id: 'unit-tests',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*10/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
          /npm ci/,
          /npm run test:unit/,
        ],
      },
      {
        id: 'prisma-validate',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*10/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
          /npm ci/,
          /npm run prisma:validate/,
        ],
      },
    ];

    const jobsSection = extractJobsSection(workflowContent);
    requiredJobs.forEach(({ id, patterns }) => {
      const jobBlock = extractJobBlock(jobsSection, id);
      patterns.forEach((pattern: RegExp) => {
        expect(pattern.test(jobBlock)).toBe(true);
      });
    });
  });
});
